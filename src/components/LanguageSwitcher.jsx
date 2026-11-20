import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useLocale } from '@/i18n/hooks'

/**
 * Segmented language selector.
 *
 * The three labels are deliberately fixed in every locale — they are the
 * languages' own names, not translations — so the control never moves under a
 * visitor's finger when the page direction changes. It is an LTR island with
 * three equal segments; a single brand-accent plate slides between them and is
 * measured from the active button so labels of different widths stay marked.
 */
const LANGUAGES = [
  { id: 'en', label: 'Eng' },
  { id: 'ps', label: 'پښتو' },
  { id: 'fa-AF', label: 'دری' },
]

export default function LanguageSwitcher({ tone = 'light', className = '', onSwitch }) {
  const { locale, switchTo, transitioning } = useLocale()
  const { t } = useTranslation()
  const dark = tone === 'dark'
  const activeRef = useRef(null)
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })

  useLayoutEffect(() => {
    const button = activeRef.current
    if (!button) return
    setIndicator({ x: button.offsetLeft, width: button.offsetWidth })
  }, [locale])

  const select = (id) => {
    if (transitioning || id === locale) return
    onSwitch?.()
    switchTo(id)
  }

  return (
    <div
      role="group"
      aria-label={t('Language', { ns: 'common' })}
      dir="ltr"
      className={`u-locale-switch ${dark ? 'u-locale-switch--dark' : ''} ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className="u-locale-switch__indicator"
        style={{
          width: `${indicator.width}px`,
          transform: `translateX(${indicator.x}px)`,
        }}
      />
      {LANGUAGES.map((language) => {
        const active = language.id === locale
        return (
          <button
            key={language.id}
            ref={active ? activeRef : undefined}
            type="button"
            lang={language.id}
            aria-pressed={active}
            disabled={transitioning}
            onClick={() => select(language.id)}
            className={`u-locale-switch__option ${active ? 'is-active' : ''}`}
          >
            {language.label}
          </button>
        )
      })}
    </div>
  )
}
