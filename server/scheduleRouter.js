import { json } from './lib/schedulingServer.js'
import availability from './handlers/availability.js'
import book from './handlers/book.js'
import cancel from './handlers/cancel.js'
import manage from './handlers/manage.js'
import reminder from './handlers/reminder.js'
import reschedule from './handlers/reschedule.js'

/**
 * INTERNAL SCHEDULE ROUTER
 * ============================================================================
 * Vercel creates one Serverless Function per entry-point file in `api/`. The
 * Hobby plan allows at most 12, so the six schedule endpoints share one
 * function: `api/schedule.js`. `vercel.json` rewrites each public URL to that
 * function with a `route` query parameter, and this module dispatches to the
 * handler that used to live at the matching file path.
 *
 * The public URLs are unchanged. Only the deploy-time file layout changed.
 */

export const SCHEDULE_ROUTES = Object.freeze({
  availability,
  book,
  manage,
  cancel,
  reschedule,
  reminder,
})

function knownRoute(value) {
  return typeof value === 'string' && Object.hasOwn(SCHEDULE_ROUTES, value) ? value : null
}

/** Resolve the route from either a Vercel rewrite query or a direct file-style URL. */
export function resolveScheduleRoute(req = {}) {
  const fromQuery = knownRoute(req.query?.route) || knownRoute(req.query?.__route)
  if (fromQuery) return fromQuery

  const url = new URL(req.url || '/', 'https://afghanfutian.com')
  const fromUrl =
    knownRoute(url.searchParams.get('route')) || knownRoute(url.searchParams.get('__route'))
  if (fromUrl) return fromUrl

  const match = url.pathname.match(/^\/api\/schedule\/([^/]+)\/?$/)
  return match ? knownRoute(match[1]) : null
}

/** A factory keeps the router testable without sending real provider requests. */
export function createScheduleRouter(routes = SCHEDULE_ROUTES) {
  return async function scheduleHandler(req, res) {
    const route = resolveScheduleRoute(req)
    if (!route || typeof routes[route] !== 'function') {
      return json(res, 404, { ok: false, error: 'not_found' })
    }
    return routes[route](req, res)
  }
}

export const scheduleHandler = createScheduleRouter()

export default scheduleHandler
