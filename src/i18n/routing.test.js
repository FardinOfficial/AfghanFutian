import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  HTML_ATTRIBUTES,
  LOCALES,
  LOCALE_PREFIX,
  OG_LOCALE,
  PREFIX_LOCALE,
  STORAGE_KEY,
  initialLocale,
  isLocale,
  localeFromPath,
  localizedPath,
  readStoredLocale,
  storeLocale,
  stripLocale,
  switchedPath,
} from './routing.js'

/**
 * Unit tests for the framework-free routing helpers. Node's built-in test
 * runner keeps this dependency-free. Storage is stubbed on globalThis.window
 * and removed after every test so browser state never leaks between cases.
 */
function installWindow({ stored = null, pathname = '/', failGet = false, failSet = false } = {}) {
  const calls = { get: [], set: [] }
  const localStorage = {
    getItem(key) {
      calls.get.push(key)
      if (failGet) throw new Error('localStorage is disabled')
      return stored
    },
    setItem(key, value) {
      calls.set.push([key, value])
      if (failSet) throw new Error('localStorage is disabled')
      stored = value
    },
  }
  globalThis.window = { location: { pathname }, localStorage }
  return calls
}

afterEach(() => {
  delete globalThis.window
})

describe('routing constants', () => {
  it('maps internal locale ids to public prefixes and back', () => {
    assert.deepEqual(LOCALES, ['en', 'ps', 'fa-AF'])
    assert.deepEqual(LOCALE_PREFIX, { en: '', ps: '/ps', 'fa-AF': '/fa' })
    assert.deepEqual(PREFIX_LOCALE, { '/ps': 'ps', '/fa': 'fa-AF' })
    assert.equal(STORAGE_KEY, 'afghan-futian-locale')
  })

  it('provides root HTML attributes for every locale', () => {
    assert.deepEqual(HTML_ATTRIBUTES, {
      en: { lang: 'en', dir: 'ltr' },
      ps: { lang: 'ps', dir: 'rtl' },
      'fa-AF': { lang: 'fa-AF', dir: 'rtl' },
    })
  })

  it('provides Open Graph locale values for every locale', () => {
    assert.deepEqual(OG_LOCALE, {
      en: 'en_US',
      ps: 'ps_AF',
      'fa-AF': 'fa_AF',
    })
  })

  it('recognises only supported internal locale ids', () => {
    assert.equal(isLocale('en'), true)
    assert.equal(isLocale('ps'), true)
    assert.equal(isLocale('fa-AF'), true)
    assert.equal(isLocale('fa'), false)
    assert.equal(isLocale('fr'), false)
    assert.equal(isLocale(null), false)
  })
})

describe('localeFromPath', () => {
  it('returns null for unprefixed paths', () => {
    for (const path of ['', '/', '/about', '/about/team', '/faq', '/faq/about', '/PS/about']) {
      assert.equal(localeFromPath(path), null, `path: ${path}`)
    }
  })

  it('recognises the Pashto prefix', () => {
    for (const path of ['/ps', '/ps/', '/ps/about', '/ps/about?x=1#top']) {
      assert.equal(localeFromPath(path), 'ps', `path: ${path}`)
    }
  })

  it('recognises the short Dari prefix and maps it to fa-AF', () => {
    for (const path of ['/fa', '/fa/', '/fa/about', '/fa/about?x=1#top']) {
      assert.equal(localeFromPath(path), 'fa-AF', `path: ${path}`)
    }
  })
})

describe('stripLocale', () => {
  it('leaves unprefixed paths alone', () => {
    const cases = [
      ['/', '/'],
      ['/about', '/about'],
      ['/about/team', '/about/team'],
      ['/about?ref=home#top', '/about?ref=home#top'],
      ['/faq', '/faq'],
      ['/faq/about', '/faq/about'],
    ]
    for (const [path, expected] of cases) {
      assert.equal(stripLocale(path), expected, `path: ${path}`)
    }
  })

  it('removes the ps prefix, keeping query and hash', () => {
    const cases = [
      ['/ps', '/'],
      ['/ps/', '/'],
      ['/ps/about', '/about'],
      ['/ps/about?x=1#top', '/about?x=1#top'],
    ]
    for (const [path, expected] of cases) {
      assert.equal(stripLocale(path), expected, `path: ${path}`)
    }
  })

  it('removes the fa prefix, keeping query and hash', () => {
    const cases = [
      ['/fa', '/'],
      ['/fa/', '/'],
      ['/fa/about', '/about'],
      ['/fa/about?x=1#top', '/about?x=1#top'],
    ]
    for (const [path, expected] of cases) {
      assert.equal(stripLocale(path), expected, `path: ${path}`)
    }
  })
})

describe('localizedPath', () => {
  it('never prefixes English paths', () => {
    assert.equal(localizedPath('/', 'en'), '/')
    assert.equal(localizedPath('/about', 'en'), '/about')
    assert.equal(localizedPath('/about?x=1#top', 'en'), '/about?x=1#top')
  })

  it('prefixes Pashto paths once', () => {
    const cases = [
      ['/', '/ps'],
      ['', '/ps'],
      ['/about', '/ps/about'],
      ['about', '/ps/about'],
      ['/ps/about', '/ps/about'],
    ]
    for (const [path, expected] of cases) {
      assert.equal(localizedPath(path, 'ps'), expected, `path: ${path}`)
    }
  })

  it('prefixes Dari paths once with the short public prefix', () => {
    const cases = [
      ['/', '/fa'],
      ['', '/fa'],
      ['/about', '/fa/about'],
      ['about', '/fa/about'],
      ['/fa/about', '/fa/about'],
    ]
    for (const [path, expected] of cases) {
      assert.equal(localizedPath(path, 'fa-AF'), expected, `path: ${path}`)
    }
  })

  it('treats an unknown locale as unprefixed', () => {
    assert.equal(localizedPath('/about', 'fr'), '/about')
    assert.equal(localizedPath('/about'), '/about')
  })
})

describe('switchedPath', () => {
  it('switches between locales without stacking prefixes', () => {
    const cases = [
      ['/about', '', '', 'en', '/about'],
      ['/', '', '', 'en', '/'],
      ['/', '', '', 'ps', '/ps'],
      ['/', '', '', 'fa-AF', '/fa'],
      ['/about', '', '', 'ps', '/ps/about'],
      ['/about', '', '', 'fa-AF', '/fa/about'],
      ['/ps/about', '', '', 'en', '/about'],
      ['/fa/about', '', '', 'en', '/about'],
      ['/fa/about', '', '', 'ps', '/ps/about'],
      ['/ps/about', '', '', 'fa-AF', '/fa/about'],
      ['/ps', '', '', 'fa-AF', '/fa'],
      ['/fa', '', '', 'ps', '/ps'],
    ]
    for (const [path, search, hash, locale, expected] of cases) {
      assert.equal(switchedPath(path, search, hash, locale), expected, `${path} → ${locale}`)
    }
  })

  it('preserves query strings and hashes while switching', () => {
    const cases = [
      ['/about', '?q=1', '#results', 'ps', '/ps/about?q=1#results'],
      ['/about', '?q=1', '#results', 'fa-AF', '/fa/about?q=1#results'],
      ['/about', '?q=1#results', '', 'ps', '/ps/about?q=1#results'],
      ['/about', '?q=1', '#results', 'en', '/about?q=1#results'],
      ['/ps/about', '?q=1', '#results', 'ps', '/ps/about?q=1#results'],
      ['/fa/about', '?q=1', '#results', 'fa-AF', '/fa/about?q=1#results'],
      ['/', '?lang=old#hero', '', 'ps', '/ps?lang=old#hero'],
      ['/ps', '?q=1#results', '', 'fa-AF', '/fa?q=1#results'],
    ]
    for (const [path, search, hash, locale, expected] of cases) {
      assert.equal(switchedPath(path, search, hash, locale), expected, `${path}${search}${hash} → ${locale}`)
    }
  })
})

describe('initialLocale', () => {
  it('lets an explicit URL prefix win over the stored preference', () => {
    installWindow({ stored: 'fa-AF', pathname: '/ps' })
    assert.equal(initialLocale('/ps'), 'ps')
    assert.equal(initialLocale('/ps/about'), 'ps')

    installWindow({ stored: 'ps', pathname: '/fa' })
    assert.equal(initialLocale('/fa'), 'fa-AF')
    assert.equal(initialLocale('/fa/about'), 'fa-AF')
  })

  it('defaults unprefixed deep links to English despite a stored preference', () => {
    installWindow({ stored: 'ps' })
    assert.equal(initialLocale('/about'), 'en')
    assert.equal(initialLocale('/about/team'), 'en')
    assert.equal(initialLocale('/faq'), 'en')
  })

  it('uses the stored preference on the unprefixed homepage only', () => {
    installWindow({ stored: 'ps' })
    assert.equal(initialLocale('/'), 'ps')

    installWindow({ stored: 'fa-AF' })
    assert.equal(initialLocale('/'), 'fa-AF')

    installWindow({ stored: 'fr' })
    assert.equal(initialLocale('/'), 'en')

    installWindow({ stored: null })
    assert.equal(initialLocale('/'), 'en')
  })

  it('falls back to window.location.pathname when no path is passed', () => {
    installWindow({ stored: 'ps', pathname: '/' })
    assert.equal(initialLocale(), 'ps')

    installWindow({ stored: 'ps', pathname: '/contact' })
    assert.equal(initialLocale(), 'en')

    delete globalThis.window
    assert.equal(initialLocale(), 'en')
  })
})

describe('readStoredLocale / storeLocale', () => {
  it('reads supported stored locales', () => {
    installWindow({ stored: 'ps' })
    assert.equal(readStoredLocale(), 'ps')

    installWindow({ stored: 'fa-AF' })
    assert.equal(readStoredLocale(), 'fa-AF')
  })

  it('ignores missing or unsupported stored values', () => {
    for (const stored of [null, '', 'fr', 'fa', 'EN']) {
      installWindow({ stored })
      assert.equal(readStoredLocale(), null, `stored: ${stored}`)
    }
  })

  it('reads the value under the documented storage key', () => {
    const calls = installWindow({ stored: 'ps' })
    readStoredLocale()
    assert.deepEqual(calls.get, [STORAGE_KEY])
  })

  it('persists supported locales under the documented key', () => {
    const calls = installWindow()
    storeLocale('ps')
    assert.deepEqual(calls.set, [[STORAGE_KEY, 'ps']])

    storeLocale('fa-AF')
    assert.deepEqual(calls.set, [
      [STORAGE_KEY, 'ps'],
      [STORAGE_KEY, 'fa-AF'],
    ])
  })

  it('does not persist unsupported locales', () => {
    const calls = installWindow()
    storeLocale('fa')
    storeLocale('fr')
    storeLocale(null)
    assert.deepEqual(calls.set, [])
  })

  it('tolerates disabled storage on both read and write', () => {
    const calls = installWindow({ stored: 'ps', failGet: true, failSet: true })
    assert.equal(readStoredLocale(), null)
    assert.doesNotThrow(() => storeLocale('ps'))
    assert.deepEqual(calls.get, [STORAGE_KEY])
    assert.deepEqual(calls.set, [[STORAGE_KEY, 'ps']])
  })

  it('tolerates a localStorage accessor that throws', () => {
    globalThis.window = {}
    Object.defineProperty(globalThis.window, 'localStorage', {
      get() {
        throw new Error('storage blocked')
      },
    })
    assert.equal(readStoredLocale(), null)
    assert.doesNotThrow(() => storeLocale('ps'))
  })

  it('is a no-op when there is no window', () => {
    delete globalThis.window
    assert.equal(readStoredLocale(), null)
    assert.doesNotThrow(() => storeLocale('ps'))
  })
})
