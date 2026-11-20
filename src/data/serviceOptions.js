/**
 * SERVICE OPTIONS — the single source of truth for the contact form's
 * "service of interest" select.
 *
 * Why this lives in its own module
 * ----------------------------------------------------------------------------
 * It is needed in two very different places:
 *
 *   • The browser, via `src/data/contact.js`, to render the select.
 *   • The server, via `api/contact.js`, to validate that the value submitted is
 *     one the form actually offers.
 *
 * The server runs on plain Node ESM, which — unlike Vite — requires explicit
 * file extensions on relative imports and cannot pull in a module that reaches
 * for one without. Keeping this list in a leaf file with no imports of its own
 * means the server can reach it without dragging in the whole content graph
 * (photography, navigation, routes) that the rest of `services.js` needs.
 *
 * `src/data/services.js` re-exports it, so nothing else has to know it moved.
 */
export const SERVICE_OPTIONS = [
  'Product sourcing',
  'Trade coordination',
  'Supply chain coordination',
  'Cargo & logistics',
  'General enquiry',
]

export default { SERVICE_OPTIONS }
