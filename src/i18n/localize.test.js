import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { localize } from './localize.js'

/** Translation spy: returns `<namespace>:<key>` and records every lookup. */
function translationMock() {
  const calls = []
  const t = (key, options) => {
    calls.push([key, options?.ns])
    return `${options?.ns}:${key}`
  }
  return { t, calls }
}

const machineStrings = [
  '/about',
  '/media/hero.jpg',
  'https://example.com/about',
  'http://example.com',
  'mailto:hello@example.com',
  'tel:+93700123456',
  '#section',
  '+93 700 123 456',
  '2026',
  '12,345',
]

describe('localize', () => {
  it('translates human-facing strings using the supplied namespace', () => {
    const { t, calls } = translationMock()
    assert.equal(localize('From Yiwu.', 'common', t), 'common:From Yiwu.')
    assert.equal(localize('Explore Our Services', 'home', t), 'home:Explore Our Services')
    assert.deepEqual(calls, [
      ['From Yiwu.', 'common'],
      ['Explore Our Services', 'home'],
    ])
  })

  it('leaves machine-like values untouched without calling the translator', () => {
    const { t, calls } = translationMock()
    for (const value of machineStrings) {
      assert.equal(localize(value, 'common', t), value, `value: ${value}`)
    }
    assert.deepEqual(calls, [])
  })

  it('skips machine keys, translates copy, and preserves non-string primitives', () => {
    const source = {
      id: 'section-hero',
      name: 'hero',
      to: '/about',
      href: 'https://example.com',
      src: '/media/hero.jpg',
      type: 'hero',
      status: 'ready',
      index: 2,
      title: 'From Yiwu.',
      phone: '+93 700 123 456',
      email: 'hello@example.com',
      website: 'https://example.com',
      hero: {
        src: '/media/hero.jpg',
        alt: 'Warehouse in Kabul',
        caption: 'Connecting Markets.',
      },
      contact: {
        phone: '+93 700 123 456',
        emailHref: 'mailto:hello@example.com',
        label: 'Contact Our Team',
      },
      items: [{ title: 'Product sourcing', to: '/services' }, 'Explore Our Services'],
      nested: { group: { heading: 'Start a Conversation' } },
      count: 3,
      enabled: true,
      missing: null,
      ratio: 1.5,
    }
    const snapshot = JSON.parse(JSON.stringify(source))
    const { t, calls } = translationMock()

    assert.deepEqual(localize(source, 'home', t), {
      id: 'section-hero',
      name: 'hero',
      to: '/about',
      href: 'https://example.com',
      src: '/media/hero.jpg',
      type: 'hero',
      status: 'ready',
      index: 2,
      title: 'home:From Yiwu.',
      phone: '+93 700 123 456',
      email: 'hello@example.com',
      website: 'https://example.com',
      hero: {
        src: '/media/hero.jpg',
        alt: 'media:Warehouse in Kabul',
        caption: 'home:Connecting Markets.',
      },
      contact: {
        phone: '+93 700 123 456',
        emailHref: 'mailto:hello@example.com',
        label: 'home:Contact Our Team',
      },
      items: [
        { title: 'home:Product sourcing', to: '/services' },
        'home:Explore Our Services',
      ],
      nested: { group: { heading: 'home:Start a Conversation' } },
      count: 3,
      enabled: true,
      missing: null,
      ratio: 1.5,
    })

    assert.deepEqual(calls.map(([key]) => key).sort(), [
      'Connecting Markets.',
      'Contact Our Team',
      'Explore Our Services',
      'From Yiwu.',
      'Product sourcing',
      'Start a Conversation',
      'Warehouse in Kabul',
    ])
    assert.ok(calls.some(([key, ns]) => key === 'Warehouse in Kabul' && ns === 'media'))
    assert.deepEqual(source, snapshot, 'localize must not mutate the source data')
  })

  it('routes alt text to the media namespace, including inside arrays', () => {
    const { t, calls } = translationMock()
    assert.deepEqual(
      localize([{ src: '/media/gallery.jpg', alt: 'Port in China' }], 'services', t),
      [{ src: '/media/gallery.jpg', alt: 'media:Port in China' }],
    )
    assert.deepEqual(calls, [['Port in China', 'media']])
  })

  it('skips whole subtrees held under machine keys', () => {
    const source = {
      image: { src: '/media/hero.jpg', alt: 'Warehouse in Kabul', caption: 'A caption' },
      CAL_LINK: 'Book a meeting',
      DEFAULT_TIME_ZONE: 'Kabul',
    }
    const { t, calls } = translationMock()
    assert.deepEqual(localize(source, 'home', t), source)
    assert.deepEqual(calls, [])
  })

  it('handles arrays, nested objects, empty objects, and primitive roots', () => {
    const { t, calls } = translationMock()
    assert.deepEqual(localize(['First note', '/local/path', { label: 'Second note' }], 'pages', t), [
      'pages:First note',
      '/local/path',
      { label: 'pages:Second note' },
    ])
    assert.deepEqual(localize({}, 'common', t), {})
    assert.equal(localize(null, 'common', t), null)
    assert.equal(localize(0, 'common', t), 0)
    assert.equal(localize(false, 'common', t), false)
    assert.deepEqual(calls, [
      ['First note', 'pages'],
      ['Second note', 'pages'],
    ])
  })

  it('only treats string alt values as media copy', () => {
    const { t, calls } = translationMock()
    assert.deepEqual(localize({ alt: { label: 'Image details' } }, 'home', t), {
      alt: { label: 'home:Image details' },
    })
    assert.deepEqual(calls, [['Image details', 'home']])
  })
})
