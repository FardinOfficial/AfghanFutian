import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

/**
 * The browser bundle must never contain a private integration credential.
 * This checks the modules Vite can reach from React; the server-only helpers
 * are excluded by name and live behind `api/schedule/` only.
 */
const ROOT = process.cwd()
const SERVER_ONLY = new Set([
  'schedulingServer.js',
  'schedulingMailer.js',
  'schedulingEmail.js',
])
const SECRET_NAMES = [
  'CAL_API_KEY',
  'CAL_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'SCHEDULE_TOKEN_SECRET',
  'CONTACT_ALLOWED_ORIGIN',
]

function browserFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...browserFiles(full))
      continue
    }
    if (!/\.(js|jsx)$/.test(entry)) continue
    if (entry.endsWith('.test.js') || SERVER_ONLY.has(entry)) continue
    files.push(full)
  }
  return files
}

test('browser-safe source never references a secret or a server-only helper', () => {
  const files = [
    ...browserFiles(join(ROOT, 'src/components')),
    ...browserFiles(join(ROOT, 'src/pages')),
    ...browserFiles(join(ROOT, 'src/lib')),
    ...browserFiles(join(ROOT, 'src/data')),
    ...browserFiles(join(ROOT, 'src/hooks')),
  ]
  assert.ok(files.length > 20)

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const relative = file.slice(ROOT.length + 1)
    for (const name of SECRET_NAMES) {
      assert.doesNotMatch(source, new RegExp(`\\b${name}\\b`), `${relative} mentions ${name}`)
    }
    assert.doesNotMatch(
      source,
      /schedulingServer|schedulingMailer|schedulingEmail/,
      `${relative} imports a server-only helper`,
    )
  }
})

test('secrets are read only in the server-only scheduling module', () => {
  const server = readFileSync(join(ROOT, 'src/lib/schedulingServer.js'), 'utf8')
  for (const name of [
    'CAL_API_KEY',
    'CAL_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'SCHEDULE_TOKEN_SECRET',
  ]) {
    assert.match(server, new RegExp(`\\b${name}\\b`), `${name} is not handled server-side`)
  }
  assert.match(server, /process\.env\.CAL_API_KEY/)
  assert.match(server, /process\.env\.RESEND_API_KEY/)
})
