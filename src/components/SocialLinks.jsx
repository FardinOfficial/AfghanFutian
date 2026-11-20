import { useTranslation } from 'react-i18next'

import { useNavigation } from '@/i18n/hooks'

/**
 * SocialLinks.
 *
 * Set as editorial text rather than a row of icon squares — it matches the
 * typographic language of the rest of the site, and it removes an accessibility
 * trap: a badge whose visible letters do not match its accessible name is
 * flagged by every serious audit, and rightly so.
 *
 * The labels and URLs come from the single company-data module. Entries with
 * no confirmed URL render as plain text rather than as empty links.
 *
 * @param {{ tone?: 'light' | 'dark', className?: string, onNavigate?: () => void }} props
 */
export default function SocialLinks({ tone = 'light', className = '', onNavigate }) {
  const { t } = useTranslation()
  const { SOCIAL_LINKS } = useNavigation()
  const isDark = tone === 'dark'

  return (
    <ul className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`}>
      {SOCIAL_LINKS.map((social) => {
        const isLive = Boolean(social.href)

        return (
          <li key={social.label}>
            {isLive ? (
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${social.label} ${t('— opens in a new tab', { ns: 'common' })}`}
                onClick={onNavigate}
                className={`u-link text-sm transition-opacity duration-300 ${
                  isDark ? 'text-canvas/75 hover:text-canvas' : 'text-ink-70 hover:text-ink'
                }`}
              >
                {social.label}
              </a>
            ) : (
              <span className={`text-sm ${isDark ? 'text-canvas-muted' : 'text-muted-strong'}`}>
                {social.label}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
