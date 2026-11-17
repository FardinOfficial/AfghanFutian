import { EASE, gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * HERO — cinematic entrance.
 *
 * The hero is the one place where motion is allowed to be theatrical. It runs
 * exactly once, immediately after the preloader hands over, and then settles
 * into a calm scroll-driven parallax for the rest of the visit.
 *
 * Structure of the timeline:
 *   1. Image unmasks from the centre outward (clip-path), then drifts down
 *      to its resting scale — the "camera settling" beat.
 *   2. Typography arrives line by line from behind a mask.
 *   3. Supporting copy, actions and the meta rail follow in a tight stagger.
 *   4. The scroll indicator fades in last, once the composition is complete.
 */

/**
 * @param {object} refs
 * @param {HTMLElement} refs.root
 * @param {HTMLElement} [refs.imageWrap]
 * @param {HTMLElement} [refs.image]
 * @param {HTMLElement} [refs.eyebrow]
 * @param {HTMLElement} [refs.headline]
 * @param {HTMLElement} [refs.description]
 * @param {HTMLElement} [refs.actions]
 * @param {HTMLElement[]} [refs.meta]
 * @param {HTMLElement} [refs.scrollCue]
 * @returns {gsap.core.Timeline}
 */
export function buildHeroIntro(refs) {
  const {
    imageWrap,
    image,
    eyebrow,
    headline,
    description,
    actions,
    meta = [],
    scrollCue,
  } = refs

  const tl = gsap.timeline({ defaults: { ease: EASE.editorial } })

  if (prefersReducedMotion()) {
    // Nothing to choreograph: make sure everything is simply visible.
    tl.set([imageWrap, eyebrow, description, actions, scrollCue, ...meta].filter(Boolean), {
      opacity: 1,
      clipPath: 'inset(0% 0% 0% 0%)',
    })
    return tl
  }

  if (imageWrap) {
    tl.fromTo(
      imageWrap,
      { clipPath: 'inset(14% 18% 14% 18%)', opacity: 0.2 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        opacity: 1,
        duration: 1.7,
        ease: EASE.architectural,
      },
      0,
    )
  }

  if (image) {
    // Oversized and slightly high, then drifts into place — the classic
    // "settling lens" move. Ends at scale 1 so hover/parallax can take over.
    tl.fromTo(
      image,
      { scale: 1.22, yPercent: -3 },
      { scale: 1, yPercent: 0, duration: 2.1, ease: EASE.architectural },
      0,
    )
  }

  // Hairlines that draw across the composition.
  tl.fromTo(
    '.hero-rule',
    { scaleX: 0, transformOrigin: 'left center' },
    { scaleX: 1, duration: 1.4, ease: EASE.architectural, stagger: 0.12 },
    0.35,
  )

  if (eyebrow) {
    tl.fromTo(
      eyebrow,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9 },
      0.55,
    )
  }

  // The hero headline is hand-authored as two masked lines rather than run
  // through SplitText. A display statement this large needs full control over
  // where the line breaks, and it keeps the markup semantic and readable.
  if (headline) {
    const lines = headline.querySelectorAll('.line-inner')
    tl.fromTo(
      lines,
      { yPercent: 118 },
      { yPercent: 0, duration: 1.25, ease: EASE.reveal, stagger: 0.11 },
      0.62,
    )
  }

  if (description) {
    tl.fromTo(
      description,
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 },
      1.05,
    )
  }

  if (actions) {
    tl.fromTo(
      actions.children,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, stagger: 0.09 },
      1.2,
    )
  }

  if (meta.length) {
    tl.fromTo(
      meta,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 },
      1.35,
    )
  }

  if (scrollCue) {
    tl.fromTo(scrollCue, { opacity: 0 }, { opacity: 1, duration: 0.7 }, 1.6)
  }

  return tl
}

/**
 * HERO — scroll parallax.
 *
 * The background drifts slower than the page and the copy lifts away, which
 * reads as depth rather than movement. Deliberately subtle: this is a premium
 * corporate site, not a scroll-jacking showreel.
 */
export function buildHeroParallax({ root, image, content }) {
  if (!root || prefersReducedMotion()) return null

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  })

  if (image) tl.to(image, { yPercent: 12, ease: 'none' }, 0)
  if (content) tl.to(content, { yPercent: -8, opacity: 0.35, ease: 'none' }, 0)

  return tl
}

/**
 * Split a headline into words and give each a gentle floating loop.
 * Reserved for the hero's decorative subline, never body copy.
 */
export function buildHeadlineFloat(elements) {
  if (!elements?.length || prefersReducedMotion()) return null

  return gsap.to(elements, {
    yPercent: -6,
    duration: 2.4,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: { each: 0.15, from: 'random' },
  })
}
