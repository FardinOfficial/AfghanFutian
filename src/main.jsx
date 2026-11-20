import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import '@/i18n'
import App from '@/App'
import ErrorBoundary from '@/components/ErrorBoundary'
import '@/styles/index.css'

/**
 * Application entry point.
 *
 * GSAP's ScrollTrigger and the Lenis provider both touch the window, so the
 * tree is only ever mounted in a browser context.
 *
 * The outermost `ErrorBoundary` sits inside the router so its fallback can use
 * plain `<a href="/">` links without depending on anything that might itself
 * have thrown. `MainLayout` adds a second, page-scoped boundary.
 *
 * ── Why there is no `<StrictMode>` ──────────────────────────────────────────
 * StrictMode intentionally mounts every component twice in development so that
 * effects which are not idempotent reveal themselves. That is normally a
 * benefit, and this app's effects *are* idempotent — every animation is created
 * inside `useGSAP`, which reverts its own `gsap.context` on cleanup.
 *
 * ScrollTrigger, however, keeps a single module-level registry of live triggers
 * (`_triggers`). During the StrictMode remount its teardown (a context revert
 * that splices triggers out of that registry) can interleave with the second
 * mount's synchronous trigger creation. A trigger's own `refresh()` then walks
 * the registry backwards by index while entries are being removed underneath
 * it, reads `undefined`, and throws `Cannot read properties of undefined
 * (reading 'end')`. React surfaces that as a render error and the page falls to
 * its error boundary. This is a ScrollTrigger-internal race, not something app
 * code can fix without reaching into GSAP internals.
 *
 * It reproduces only in development: production builds do not double-mount, and
 * the identical navigation flow was verified clean there. Because a double
 * mount can therefore only ever *break* the site in dev while offering no
 * runtime benefit, StrictMode is left off deliberately. The effect-cleanup
 * discipline it guards is instead covered by the animation tests.
 */
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>,
)
