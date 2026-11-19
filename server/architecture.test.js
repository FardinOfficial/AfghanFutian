import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

/**
 * Guard the Vercel Hobby function budget.
 *
 * The failed deployment turned every `.js` file under `api/` into a function.
 * Only these three entry points may live there now; handlers, tests and helpers
 * belong in `server/`. The rewrites must also be evaluated before the SPA
 * catch-all, or the React app would swallow the API paths.
 */
const ROOT = process.cwd()
const ENTRY_POINTS = ['contact.js', 'schedule.js', 'webhook.js']
const SCHEDULE_REWRITES = {
  '/api/schedule/availability': '/api/schedule?route=availability',
  '/api/schedule/book': '/api/schedule?route=book',
  '/api/schedule/manage': '/api/schedule?route=manage',
  '/api/schedule/cancel': '/api/schedule?route=cancel',
  '/api/schedule/reschedule': '/api/schedule?route=reschedule',
  '/api/schedule/reminder': '/api/schedule?route=reminder',
  '/api/schedule/webhook': '/api/webhook',
}

test('api/ contains only the three Vercel Function entry points', () => {
  const entries = readdirSync(join(ROOT, 'api'), { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
    .sort()

  assert.deepEqual(files, ENTRY_POINTS)
  assert.equal(entries.some((entry) => entry.isDirectory()), false, 'no deployable subdirectories')
})

test('every public schedule URL is rewritten before the SPA fallback', () => {
  const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))
  const rewrites = config.rewrites ?? []
  const spaIndex = rewrites.findIndex((rule) => rule.source === '/:path((?!api/).*)')
  assert.notEqual(spaIndex, -1, 'SPA fallback must still exist')

  for (const [source, destination] of Object.entries(SCHEDULE_REWRITES)) {
    const index = rewrites.findIndex((rule) => rule.source === source)
    assert.notEqual(index, -1, `${source} has no rewrite`)
    assert.equal(rewrites[index].destination, destination)
    assert.ok(index < spaIndex, `${source} would be shadowed by the SPA fallback`)
  }
})

test('the webhook URL stays on the public /api/schedule/webhook path', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8')
  assert.match(readme, /https:\/\/afghanfutian\.com\/api\/schedule\/webhook/)
})
