import { useEffect } from 'react'

import { NOT_FOUND_META, PAGE_META } from '@/data/navigation'

/**
 * Apply per-route document metadata.
 *
 * A single-page app cannot rely on the server to swap <title> and <meta>, so
 * this hook keeps them in step with the active route. Open Graph tags are
 * updated too, which keeps shared links accurate when the site is served
 * client-side.
 *
 * Two details matter beyond the obvious tags:
 *
 *  • `og:url` is set per route. Leaving the homepage's `og:url` on every page
 *    makes social platforms attribute every shared link to the homepage, which
 *    is how a shared /sourcing link ends up previewing as the front door.
 *
 *  • A 404 is marked `noindex, nofollow` and its canonical is *removed*. The
 *    default canonical in `index.html` points at the homepage, so leaving it in
 *    place would tell a crawler that every missing URL is a duplicate of `/`.
 *
 * Note: crawlers that do not execute JavaScript still receive the defaults
 * baked into `index.html`. When the site is later rendered on a server, this
 * hook can be replaced by real head management without touching any page.
 */
export function useDocumentMeta(pathname) {
  useEffect(() => {
    // Known routes use their own metadata; anything else is a 404.
    const known = Boolean(PAGE_META[pathname])
    const meta = PAGE_META[pathname] ?? NOT_FOUND_META
    if (!meta) return

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
    setProperty('og:url', `${window.location.origin}${pathname}`)
    setNamed('robots', known ? 'index, follow' : 'noindex, nofollow')

    if (meta.image) {
      setProperty('og:image', meta.image)
      setNamed('twitter:image', meta.image)
    }

    const existingCanonical = document.querySelector('link[rel="canonical"]')

    if (known) {
      const canonical = existingCanonical ?? document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', `${window.location.origin}${pathname}`)
      if (!existingCanonical) document.head.appendChild(canonical)
    } else {
      existingCanonical?.remove()
    }
  }, [pathname])
}

export default useDocumentMeta
