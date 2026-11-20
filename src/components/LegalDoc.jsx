import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import SectionLabel from '@/components/SectionLabel'
import { useLegal } from '@/i18n/hooks'
import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * LegalDoc — the shared layout for the Privacy Notice and the Terms of Use.
 *
 * Both documents are the same object with different words, so they share one
 * component rather than two near-identical pages. The shape is deliberately not
 * the site's `PageHero`: a legal page is a document, and dressing it as a
 * photographic chapter opening would promise an experience the page does not
 * deliver. Instead it opens on the same ink ground as every other page, sets the
 * title, and states its status — draft, not in force — before the reader reaches
 * a single clause.
 *
 * Layout
 * ----------------------------------------------------------------------------
 *   masthead   — ink. Label, title, intro, status rail, then the draft banner,
 *                which is the last thing above the fold and the first thing the
 *                eye lands on. Marked with an accent square so it reads as a
 *                warning rather than as body copy.
 *   document   — canvas. A sticky contents rail on the left, the numbered
 *                sections in the right eight columns. Each section sits on a
 *                drawn hairline, the same architectural device as the rest of
 *                the site, so the page belongs to the brand without borrowing
 *                the marketing pages' compositions.
 *
 * The contents rail is a scroll-spy: the section currently in view is marked, so
 * the reader always knows where they are in a long document. It degrades to a
 * plain list of anchor links if IntersectionObserver is unavailable.
 *
 * Accessibility
 * ----------------------------------------------------------------------------
 * One `<h1>` per page. Every section is a `<section>` labelled by its own
 * `<h2>`, and the visible section numbers are `aria-hidden` so a screen reader
 * takes the order from the headings rather than hearing "zero one" before each
 * one. The contents links are real links to real anchors, so they work with the
 * keyboard, with Lenis, and — via `scroll-margin-top` — without JavaScript.
 */
export default function LegalDoc({ doc }) {
  const { t } = useTranslation()
  const { LEGAL_CONTACT, LEGAL_DRAFT } = useLegal()
  const rootRef = useRef(null)
  const headingRef = useRef(null)
  const introRef = useRef(null)
  const metaRef = useRef(null)
  const draftRef = useRef(null)

  const [activeId, setActiveId] = useState(doc.sections[0]?.id ?? null)

  useGSAP(
    () => {
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 84%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })

      fadeRise(introRef.current, { trigger: introRef.current, start: 'top 90%', y: 20 })
      fadeRise(metaRef.current, { trigger: metaRef.current, start: 'top 92%', y: 16 })
      fadeRise(draftRef.current, { trigger: draftRef.current, start: 'top 94%', y: 16 })

      // The section rules draw in, and each section's content rises once, as it
      // arrives. Per-section triggers rather than one for the whole column: a
      // document is long enough that a single trigger would reveal the last
      // clause while the first was still on screen.
      gsap.utils.toArray('.legal-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 94%', delay: (index % 3) * 0.05 })
      })
      gsap.utils.toArray('.legal-item-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 94%', delay: (index % 4) * 0.05 })
      })
      gsap.utils.toArray('.legal-section').forEach((section) => {
        fadeRise(section.querySelector('.legal-block'), { trigger: section, start: 'top 88%', y: 22 })
      })
    },
    { dependencies: [doc], scope: rootRef },
  )

  useEffect(() => {
    const nodes = doc.sections.map((section) => document.getElementById(section.id)).filter(Boolean)
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (inView[0]) setActiveId(inView[0].target.id)
      },
      // A narrow band near the upper third of the viewport, so the marked entry
      // is the one being read rather than whatever happens to be at the edge.
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [doc])

  return (
    <article ref={rootRef}>
      {/* ---- Masthead ----------------------------------------------------- */}
      <header data-nav-sentinel className="relative overflow-hidden bg-ink text-canvas">
        <div className="u-container pb-[clamp(3.5rem,8vh,6rem)] pt-[132px] lg:pt-[180px]">
          <SectionLabel index={doc.index} tone="dark">
            {doc.label}
          </SectionLabel>

          <h1
            ref={headingRef}
            className="mt-10 max-w-[18ch] font-display text-display-1 font-medium uppercase lg:mt-12"
          >
            {doc.title}
          </h1>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-8">
            <p ref={introRef} className="u-lead max-w-[46ch] text-canvas/70 lg:col-span-6">
              {doc.intro}
            </p>

            <dl
              ref={metaRef}
              className="flex flex-wrap gap-x-10 gap-y-6 self-end lg:col-span-4 lg:col-start-9"
            >
              {doc.meta.map((item) => (
                <div key={item.label}>
                  <dt className="u-eyebrow text-canvas-muted">{item.label}</dt>
                  <dd className="mt-2 font-display text-[0.9375rem] tracking-[-0.01em] text-canvas/85">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ---- Draft banner --------------------------------------------- */}
          <div
            ref={draftRef}
            className="mt-[clamp(3rem,6vh,4.5rem)] border-t border-line-invert pt-8 lg:pt-10"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-3">
                <span className="inline-flex items-center gap-3">
                  <span aria-hidden="true" className="h-[9px] w-[9px] shrink-0 bg-accent" />
                  <span className="u-eyebrow text-accent">{LEGAL_DRAFT.eyebrow}</span>
                </span>
              </div>

              <div className="lg:col-span-8 lg:col-start-5">
                <p className="max-w-[26ch] font-display text-display-3 font-medium uppercase text-canvas">
                  {LEGAL_DRAFT.title}
                </p>
                <p className="mt-4 max-w-[64ch] text-[0.9375rem] leading-relaxed text-canvas/70">
                  {LEGAL_DRAFT.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Document ----------------------------------------------------- */}
      <div className="u-section bg-canvas">
        <div className="u-container">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-8">
            <nav
              aria-label={t('Contents', { ns: 'common' })}
              className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start"
            >
              <h2 className="u-eyebrow">{t('Contents', { ns: 'common' })}</h2>
              <ol className="mt-6 space-y-3.5 border-l border-line pl-5">
                {doc.sections.map((section) => {
                  const active = section.id === activeId
                  return (
                    <li key={section.id}>
                      {/* In-page anchor, not a route link: a plain hash keeps the
                          reader on this document in every locale. LocaleLink
                          would prefix the hash and land on a different page. */}
                      <a
                        href={`#${section.id}`}
                        aria-current={active ? 'true' : undefined}
                        className={`flex gap-3 text-sm leading-snug transition-colors duration-300 ${
                          active ? 'text-ink' : 'text-muted-strong hover:text-ink'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`shrink-0 tabular-nums transition-colors duration-300 ${
                            active ? 'text-ink' : 'text-muted-strong'
                          }`}
                        >
                          {section.index}
                        </span>
                        <span className={active ? 'underline decoration-line underline-offset-4' : ''}>
                          {section.heading}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ol>
            </nav>

            <div className="lg:col-span-8 lg:col-start-5">
              {doc.sections.map((section) => (
                <LegalSection key={section.id} section={section} />
              ))}

              {/* ---- Contact ------------------------------------------------- */}
              <section aria-labelledby="legal-contact-heading" className="pt-10 lg:pt-12">
                <span
                  aria-hidden="true"
                  className="legal-rule block h-px w-full origin-left bg-line"
                />
                <div className="mt-8">
                  <h2 id="legal-contact-heading" className="u-eyebrow">
                    {doc.contact.label}
                  </h2>
                  <p className="mt-5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted-strong">
                    {doc.contact.body}
                  </p>
                  <a
                    href={LEGAL_CONTACT.emailHref}
                    className="u-link mt-7 inline-flex font-display text-display-3 font-medium text-ink"
                  >
                    {LEGAL_CONTACT.email}
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * One numbered clause: a drawn rule, the number, the heading, and either prose or
 * a set of labelled points. Kept local because it is only ever used here.
 */
function LegalSection({ section }) {
  const headingId = `${section.id}-heading`

  return (
    <section
      id={section.id}
      aria-labelledby={headingId}
      className="legal-section pt-10 first:pt-0 lg:pt-12"
    >
      <span aria-hidden="true" className="legal-rule block h-px w-full origin-left bg-line" />

      <div className="legal-block mt-8 flex gap-5 lg:gap-8">
        <span aria-hidden="true" className="u-eyebrow shrink-0 pt-1.5 tabular-nums">
          {section.index}
        </span>

        <div className="min-w-0">
          <h2 id={headingId} className="font-display text-display-3 font-medium uppercase">
            {section.heading}
          </h2>

          {section.paragraphs?.length > 0 && (
            <div className="mt-6 space-y-5">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted-strong"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {section.items?.length > 0 && (
            <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2">
              {section.items.map((item) => (
                <li key={item.label}>
                  <span
                    aria-hidden="true"
                    className="legal-item-rule block h-px w-full origin-left bg-line"
                  />
                  <h3 className="mt-5 u-eyebrow">{item.label}</h3>
                  <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-strong">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
