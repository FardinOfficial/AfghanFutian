import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * useNavSentinel
 * ============================================================================
 * Drives the navbar's transparent-over-hero / solid-after-it behaviour.
 *
 * A page opts in by placing `data-nav-sentinel` on its hero section. Once any
 * part of that element scrolls above the navbar, the navbar turns solid.
 *
 * Using a sentinel rather than a `scrollY > 80` threshold means the switch
 * happens at the true end of the hero on every screen size, instead of at a
 * magic number that is wrong on most of them.
 *
 * The subtlety this hook exists to solve: the navbar lives in the layout, the
 * sentinel lives in the page, and React does not guarantee they commit in the
 * same pass. React Router initialises its location in an effect, and route
 * changes are wrapped in a transition — so the layout's effect can easily run
 * *before* the new page's DOM exists. A naive `querySelector` therefore finds
 * nothing, and the navbar would default to solid over the hero.
 *
 * So: look for the sentinel, and if it is not there yet, watch the DOM until it
 * arrives. If one genuinely never appears (a page with no hero), fall back to
 * solid so the navbar never sits invisibly over light content.
 *
 * @returns {boolean} whether the navbar should render in its solid state
 */
export function useNavSentinel() {
  const [solid, setSolid] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    let observer
    let mutationObserver
    let fallbackTimer
    let cancelled = false

    const attach = () => {
      const sentinel = document.querySelector('[data-nav-sentinel]')
      if (!sentinel || cancelled) return false

      clearTimeout(fallbackTimer)
      setSolid(false)

      observer = new IntersectionObserver(
        ([entry]) => setSolid(!entry.isIntersecting),
        // Shrink the top of the root by the navbar's own height so the switch
        // happens as the hero passes *under* the bar, not as it leaves the viewport.
        { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
      )
      observer.observe(sentinel)
      return true
    }

    if (!attach()) {
      mutationObserver = new MutationObserver(() => {
        if (attach()) {
          mutationObserver?.disconnect()
          mutationObserver = null
        }
      })
      mutationObserver.observe(document.body, { childList: true, subtree: true })

      // Nothing to observe means this page has no hero: use the solid navbar.
      fallbackTimer = window.setTimeout(() => {
        if (!observer && !cancelled) setSolid(true)
      }, 600)
    }

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      observer?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [pathname])

  return solid
}

export default useNavSentinel
