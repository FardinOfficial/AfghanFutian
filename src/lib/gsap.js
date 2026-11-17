import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

/**
 * Single registration point for every GSAP plugin the site uses.
 *
 * Registering here (rather than inside each component) guarantees it happens
 * exactly once per bundle, and means components can simply import `gsap`,
 * `ScrollTrigger` and `SplitText` from this module.
 *
 * `useGSAP` is called with this configured gsap instance so that all hooks in
 * the app share one registry.
 */
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

// A slight default skew towards the brand's editorial easing. Individual
// tweens still override this where a different character is required.
gsap.defaults({ ease: 'power3.out', duration: 0.9 })

// ScrollTrigger is expensive when it thrashes on mobile URL-bar resize. We only
// want it to recalculate on genuine layout changes.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, SplitText, useGSAP }

export const EASE = {
  /** Long, confident settle. The house easing. */
  editorial: 'power3.out',
  /** Symmetrical in/out for masked reveals. */
  reveal: 'expo.out',
  /** Slightly springy for interactive elements. */
  ui: 'power2.out',
  /** Deliberate, almost architectural travel. */
  architectural: 'power4.inOut',
}
