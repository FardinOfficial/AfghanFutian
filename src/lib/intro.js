/**
 * Minimal intro-completion channel.
 *
 * The preloader lives in the layout while the hero lives in a page section, so
 * they cannot share props without threading state through everything in
 * between. A tiny module-level event keeps the two decoupled and, importantly,
 * handles the race where a section mounts *after* the intro has already
 * finished (client-side navigation back to the home page).
 */

const INTRO_EVENT = 'af:intro-complete'

let introComplete = false

export function markIntroComplete() {
  if (introComplete) return
  introComplete = true
  document.documentElement.classList.add('intro-complete')
  window.dispatchEvent(new CustomEvent(INTRO_EVENT))
}

export function isIntroComplete() {
  return introComplete
}

/**
 * Run `callback` once the intro has finished. Fires immediately (on the next
 * microtask) if it already has.
 *
 * @param {() => void} callback
 * @returns {() => void} unsubscribe
 */
export function onIntroComplete(callback) {
  if (introComplete) {
    const id = window.setTimeout(callback, 0)
    return () => window.clearTimeout(id)
  }

  const handler = () => callback()
  window.addEventListener(INTRO_EVENT, handler, { once: true })
  return () => window.removeEventListener(INTRO_EVENT, handler)
}

/**
 * When reduced motion is active the preloader is skipped entirely, so the
 * intro is considered complete from the very first paint.
 */
export function resetIntro() {
  introComplete = false
  document.documentElement.classList.remove('intro-complete')
}
