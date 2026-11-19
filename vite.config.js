import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * DEV-ONLY mock of the contact endpoint.
 * ============================================================================
 * ⚠️  This plugin is `apply: 'serve'`, so it exists only while `vite dev` is
 * running. It is not part of the build and must never be deployed.
 *
 * It implements the contract documented in `src/lib/api.js` — the same status
 * codes, the same error shape — so the form can be exercised end to end without
 * a Resend key. The real endpoint is `api/contact.js`.
 *
 * The rules below are intentionally a *subset* of `src/lib/validation.js`: just
 * enough to reject an obviously incomplete enquiry. The real handler must import
 * `validateForm` from that module rather than copy anything, because it is the
 * single source of truth for what a valid enquiry is. The duplication is kept
 * here, and only here, so that `vite.config.js` stays dependency-free — importing
 * application modules into the config drags their extensionless imports into
 * Vite's config loader, which warns on every build.
 *
 * What the mock deliberately does not do: persist anything, rate limit, or send
 * mail. It logs the enquiry to the terminal so you can confirm what a submission
 * actually carried.
 */
function devContactEndpoint() {
  /** Required fields and the minimum length of their trimmed value. */
  const REQUIRED = {
    name: 2,
    email: 5,
    service: 1,
    message: 20,
  }

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let raw = ''
      req.on('data', (chunk) => {
        raw += chunk
        // A contact enquiry is small; anything larger is not one.
        if (raw.length > 64_000) reject(new Error('Payload too large'))
      })
      req.on('end', () => resolve(raw))
      req.on('error', reject)
    })

  const send = (res, status, payload) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  /** A 24-character hex string, shaped like a provider's message id. */
  const fakeObjectId = () =>
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

  return {
    name: 'afghan-futian:dev-contact-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/contact', async (req, res) => {
        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST')
          return send(res, 405, { ok: false, errors: { message: 'Method not allowed.' } })
        }

        let values
        try {
          const raw = await readBody(req)
          values = JSON.parse(raw || '{}')
        } catch {
          return send(res, 400, { ok: false, errors: { message: 'Malformed request body.' } })
        }

        // The honeypot: a bot filled a field a person cannot see. Accept it
        // silently, exactly as the client does, and store nothing.
        if (typeof values?.website === 'string' && values.website.trim()) {
          server.config.logger.info('[dev contact] honeypot triggered — silently accepted')
          return send(res, 201, { ok: true, id: fakeObjectId() })
        }

        const errors = {}
        for (const [field, minLength] of Object.entries(REQUIRED)) {
          const value = typeof values?.[field] === 'string' ? values[field].trim() : ''
          if (value.length < minLength) errors[field] = 'This field needs more detail.'
        }

        if (Object.keys(errors).length > 0) {
          return send(res, 400, { ok: false, errors })
        }

        // A short delay, so the submitting state is actually observable.
        await new Promise((resolve) => setTimeout(resolve, 700))

        server.config.logger.info(
          `[dev contact] ${values.service} enquiry from ${values.name} <${values.email}>`,
        )

        return send(res, 201, { ok: true, id: fakeObjectId() })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devContactEndpoint()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Split the heavier animation vendor away from the app shell so the first
    // paint is not blocked by GSAP. Rolldown (Vite 8) requires this to be a
    // function rather than a map.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/gsap/')) return 'gsap'
          if (id.includes('/lenis/')) return 'lenis'
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id)) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
