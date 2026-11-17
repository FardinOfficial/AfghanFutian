import { SOCIAL_LINKS } from '@/data/navigation'

/**
 * SocialLinks.
 *
 * Set as editorial text rather than a row of little icon squares — it matches
 * the typographic language of the rest of the site, and it removes an
 * accessibility trap: an icon badge whose visible letters ("Ig") do not match
 * its accessible name ("Instagram") is flagged by every serious audit, and
 * rightly so.
 *
 * Entries with no confirmed URL render as plain text, not as links. When real
 * profile URLs are added to `SOCIAL_LINKS`, they become anchors automatically.
 *
 * @param {{ tone?: 'light' | 'dark', className?: string }} props
 */
export default function SocialLinks({ tone = 'light', className = '' }) {
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
                data-cursor
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
