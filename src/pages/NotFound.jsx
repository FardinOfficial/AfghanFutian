import { useTranslation } from 'react-i18next'

import Button from '@/components/Button'
import SectionLabel from '@/components/SectionLabel'
import { useNavigation } from '@/i18n/hooks'

/** 404 — kept in the site's editorial voice rather than a default error page. */
export default function NotFound() {
  const { t } = useTranslation()
  const { ROUTES } = useNavigation()

  return (
    <section
      data-nav-sentinel
      className="relative flex min-h-[100svh] items-center bg-ink text-canvas"
    >
      <div className="u-container py-32">
        <SectionLabel index="404" tone="dark">
          {t('Page Not Found', { ns: 'common' })}
        </SectionLabel>

        <h1 className="mt-10 max-w-[16ch] font-display text-display-1 font-medium uppercase">
          {t('This route does not exist.', { ns: 'common' })}
        </h1>

        <p className="u-lead mt-8 max-w-[44ch] text-canvas/70">
          {t(
            'The page you were looking for has moved or was never here. Let us get you back on track.',
            { ns: 'common' },
          )}
        </p>

        <div className="mt-11 flex flex-wrap gap-3">
          <Button to={ROUTES.home} variant="accent" size="lg">
            {t('Return Home', { ns: 'common' })}
          </Button>
          <Button to={ROUTES.contact} variant="ghost" size="lg">
            {t('Contact Our Team', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </section>
  )
}
