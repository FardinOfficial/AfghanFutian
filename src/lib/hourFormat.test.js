import assert from 'node:assert/strict'
import test from 'node:test'

import { readHourFormat, saveHourFormat } from './hourFormat.js'

test('the hour format preference survives later pages and ignores bad storage', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map()

  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
      },
    })

    assert.equal(readHourFormat(), '12')
    saveHourFormat('24')
    assert.equal(readHourFormat(), '24')
    values.set('afghan-futian:schedule-hour-format', 'nonsense')
    assert.equal(readHourFormat(), '12')

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('storage disabled') },
        setItem: () => { throw new Error('storage disabled') },
      },
    })
    assert.equal(readHourFormat(), '12')
    assert.doesNotThrow(() => saveHourFormat('24'))
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  }
})
