import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * Dictionary parity checks. These read the translation JSON straight from disk
 * so they stay fast and dependency-free while catching missing keys, empty
 * strings and dropped interpolation placeholders in the ps / fa-AF resources.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = join(HERE, 'locales')
const SOURCE_LOCALE = 'en'
const TARGET_LOCALES = ['ps', 'fa-AF']

const namespaces = readdirSync(join(LOCALES_DIR, SOURCE_LOCALE))
  .filter((name) => name.endsWith('.json'))
  .sort()

function dictionaryPath(locale, namespace) {
  return join(LOCALES_DIR, locale, namespace)
}

function readDictionary(locale, namespace) {
  return JSON.parse(readFileSync(dictionaryPath(locale, namespace), 'utf8'))
}

function placeholdersOf(value) {
  return (String(value).match(/{{[^}]+}}/g) ?? []).sort()
}

function assertNonEmptyStrings(dictionary, label) {
  for (const [key, value] of Object.entries(dictionary)) {
    assert.equal(typeof value, 'string', `${label}:${key} must be a string`)
    assert.ok(value.trim().length > 0, `${label}:${key} must not be empty`)
  }
}

function assertPlaceholdersPreserved(source, target, label) {
  for (const [key, sourceValue] of Object.entries(source)) {
    const expected = placeholdersOf(sourceValue)
    const actual = placeholdersOf(target[key])
    assert.deepEqual(actual, expected, `${label}:${key} placeholders must match en`)
  }
}

describe('locale dictionaries', () => {
  it('has English namespaces to compare against', () => {
    assert.ok(namespaces.length > 0, 'expected at least one en/*.json dictionary')
  })

  it('ships the same namespace files in every locale', () => {
    for (const locale of TARGET_LOCALES) {
      const files = readdirSync(join(LOCALES_DIR, locale))
        .filter((name) => name.endsWith('.json'))
        .sort()
      assert.deepEqual(files, namespaces, `${locale} namespaces must match en`)
    }
  })

  for (const namespace of namespaces) {
    const source = readDictionary(SOURCE_LOCALE, namespace)

    it(`en/${namespace} contains only non-empty string values`, () => {
      assert.ok(Object.keys(source).length > 0, `en/${namespace} must not be empty`)
      assertNonEmptyStrings(source, `${SOURCE_LOCALE}/${namespace}`)
    })

    for (const locale of TARGET_LOCALES) {
      it(`${locale}/${namespace} mirrors en keys, values and placeholders`, () => {
        assert.ok(existsSync(dictionaryPath(locale, namespace)), `missing ${locale}/${namespace}`)
        const target = readDictionary(locale, namespace)

        assert.deepEqual(
          Object.keys(target),
          Object.keys(source),
          `${locale}/${namespace} keys and order must match en`,
        )
        assertNonEmptyStrings(target, `${locale}/${namespace}`)
        assertPlaceholdersPreserved(source, target, `${locale}/${namespace}`)
      })
    }
  }
})
