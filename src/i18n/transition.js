/**
 * Locale transition channel.
 *
 * `LanguageSwitcher` lives deep in the navbar while the preloader lives in the
 * layout. This tiny module connects them without threading props through the
 * tree: the layout registers a handler that covers the page first, and the
 * switcher awaits it before considering the change complete.
 *
 * The handler receives an `apply` callback. It must mount the existing
 * preloader, wait until the curtain actually covers the viewport, and only then
 * call `apply()` so the language, route, typography and direction change behind
 * it. The promise it returns resolves when the curtain has lifted.
 *
 * When no handler is registered (tests, reduced motion) the change is applied
 * synchronously and behaves exactly as before.
 */

let handler = null

/** Register the layout's preloader-backed transition. */
export function setLocaleTransitionHandler(next) {
  handler = typeof next === 'function' ? next : null
}

/**
 * Ask the layout to run a locale change through the preloader.
 *
 * @param {() => void} apply applies the stored preference, i18n language and URL
 * @returns {Promise<void>}
 */
export function runLocaleTransition(apply) {
  if (!handler) {
    apply()
    return Promise.resolve()
  }
  return Promise.resolve(handler(apply))
}
