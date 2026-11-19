import { timingSafeEqual } from 'node:crypto'

import {
  CAL_API_VERSIONS,
  calRequest,
  json,
  publicError,
  signCapability,
  toBookingView,
} from '../../src/lib/schedulingServer.js'
import { sendReminder } from '../../src/lib/schedulingMailer.js'

/**
 * GET /api/schedule/reminder — protected cron endpoint.
 *
 * It is an optional reconciliation fallback: `vercel.json` does not schedule it.
 * The normal reminder is registered with Resend `scheduledAt` at booking time.
 * If that scheduled message could not be withdrawn after a change, this endpoint
 * can reconcile by asking Cal.com for bookings in the four-hour window around
 * the 24-hour mark. Cancelled or rescheduled bookings stop appearing there, so
 * no stale "see you tomorrow" reminder is sent.
 *
 * Authentication uses Vercel's CRON_SECRET: Vercel sends
 * `Authorization: Bearer $CRON_SECRET` automatically when the variable exists.
 * No secret configured → no reminders, never an anonymous public endpoint.
 */

const WINDOW_START_MS = 22 * 60 * 60 * 1000
const WINDOW_END_MS = 26 * 60 * 60 * 1000

function authorised(req) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = req.headers?.authorization || ''
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  if (!authorised(req)) return json(res, 401, { ok: false, error: 'unauthorised' })

  try {
    const now = Date.now()
    const data = await calRequest('/bookings', {
      version: CAL_API_VERSIONS.bookingList,
      query: {
        status: 'upcoming',
        eventTypeId: process.env.CAL_EVENT_TYPE_ID?.trim() || '7982708',
        afterStart: new Date(now + WINDOW_START_MS).toISOString(),
        beforeEnd: new Date(now + WINDOW_END_MS).toISOString(),
        limit: 100,
      },
    })

    const bookings = Array.isArray(data)
      ? data
      : Array.isArray(data?.bookings)
        ? data.bookings
        : Array.isArray(data?.data)
          ? data.data
          : []

    let sent = 0
    let failed = 0
    for (const entry of bookings) {
      const booking = toBookingView(entry)
      if (!booking.email || !booking.start) continue
      try {
        let manageToken
        try {
          manageToken = signCapability({ uid: booking.uid, email: booking.email })
        } catch {
          // A missing token secret means the reminder has no manage link, but
          // the meeting details are still worth sending.
        }
        await sendReminder({ ...booking, manageToken })
        sent += 1
      } catch {
        failed += 1
        console.error('[reminder] dispatch failed')
      }
    }

    console.info(`[reminder] sent=${sent} failed=${failed}`)
    return json(res, 200, { ok: true, considered: bookings.length, sent, failed })
  } catch (error) {
    return publicError(res, error)
  }
}
