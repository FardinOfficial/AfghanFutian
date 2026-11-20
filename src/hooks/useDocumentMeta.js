import { useEffect } from 'react'

import { siteUrl } from '@/data/company.js'
import { LOCALES, localizedPath, stripLocale } from '@/i18n/routing'
import { useLocale, useNavigation } from '@/i18n/hooks'

/**
 * Apply per-route, per-language document metadata.
 *
 * A single-page app cannot rely on the server to swap <title> and <meta>, so
 * this hook keeps them in step with the active route and locale. Open Graph,
 * canonical, hreflang and language tags are updated too, which keeps shared
 * links and search results accurate when the site is served client-side.
 *
 * A 404 is marked `noindex, nofollow` and its canonical is removed; the default
 * canonical in `index.html` points at the homepage, so leaving it in place
 * would tell a crawler that every missing URL is a duplicate of `/`.
 */
export function useDocumentMeta(pathname) {
  const { locale, ogLocale } = useLocale()
  const { PAGE_META, NOT_FOUND_META } = useNavigation()
  const contentPath = stripLocale(pathname) || '/'

  useEffect(() => {
    const known = Boolean(PAGE_META[contentPath])
    const meta = PAGE_META[contentPath] ?? NOT_FOUND_META
    if (!meta) return

    const canonicalUrl = (targetLocale) => {
      const path = localizedPath(contentPath, targetLocale)
      return `${siteUrl(path)}${path === '/' ? '/' : ''}`
    }

    document.title = meta.title

    const setNamed = (name, content) => {
      if (!content) return
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const setProperty = (property, content) => {
      if (!content) return
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    setNamed('description', meta.description)
    setNamed('twitter:title', meta.title)
    setNamed('twitter:description', meta.description)
    setProperty('og:title', meta.title)
    setProperty('og:description', meta.description)
    setProperty('og:url', canonicalUrl(locale))
    setProperty('og:locale', ogLocale)
    setNamed('robots', meta.robots ?? (known ? 'index, follow' : 'noindex, nofollow'))

    if (meta.image) {
      setProperty('og:image', meta.image)
      setNamed('twitter:image', meta.image)
    }

    // Alternates are rebuilt from scratch so no stale locale survives a switch.
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((tag) => tag.remove())
    const alternates = [
      ...LOCALES.map((id) => ({
        hreflang: id === 'fa-AF' ? 'fa-AF' : id,
        href: canonicalUrl(id),
      })),
      { hreflang: 'x-default', href: canonicalUrl('en') },
    ]
    for (const { hreflang, href } of alternates) {
      const tag = document.createElement('link')
      tag.setAttribute('rel', 'alternate')
      tag.setAttribute('hreflang', hreflang)
      tag.setAttribute('href', href)
      document.head.appendChild(tag)
    }

    const existingCanonical = document.querySelector('link[rel="canonical"]')

    if (known && !String(meta.robots).includes('noindex')) {
      const canonical = existingCanonical ?? document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', canonicalUrl(locale))
      if (!existingCanonical) document.head.appendChild(canonical)
    } else {
      existingCanonical?.remove()
    }
  }, [contentPath, locale, NOT_FOUND_META, ogLocale, PAGE_META])

  // Keep the fallback structured data's description in step with the locale.
  useEffect(() => {
    const ld = document.querySelector('script[type="application/ld+json"]')
    if (!ld) return
    try {
      const data = JSON.parse(ld.textContent)
      data.inLanguage = locale
      ld.textContent = JSON.stringify(data, null, 2)
    } catch {
      /* A malformed static block must not break the page. */
    }
  }, [contentPath, locale])
}

export default useDocumentMeta
