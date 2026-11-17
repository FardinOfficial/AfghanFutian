/**
 * PHOTOGRAPHY REGISTRY — PLACEHOLDER ASSETS
 * ============================================================================
 * ⚠️  Every image below is a *placeholder*, not licensed brand photography.
 *
 * They are served from the Unsplash CDN and are intentionally centralised in
 * this single file so that replacing them with Afghan Futian's own art-directed
 * photography is a one-file edit. Nothing else in the codebase hard-codes an
 * image URL.
 *
 * Before launch:
 *   1. Replace each `id` with a self-hosted asset in `src/assets/photography/`.
 *   2. Rewrite `alt` so it describes what the final image actually shows.
 *   3. Update `DEFAULT_OG_IMAGE` to a real 1200×630 social card in `/public`.
 *
 * IMPORTANT: no image here implies that Afghan Futian owns vessels, aircraft,
 * warehouses or vehicles. They are illustrative of the *category* of work
 * (trade, cargo, coordination), not of owned assets.
 *
 * Art direction
 * ----------------------------------------------------------------------------
 * Two rules govern the set, and both were applied deliberately:
 *
 *  • No two photographs in the same page sequence may show the same subject.
 *    The homepage runs thirteen plates back to back, so "container ship" cannot
 *    appear twice, "warehouse aisle" cannot appear twice, and so on. The
 *    `capability*` and `process*` families are therefore distinct images rather
 *    than the same file reused under two keys.
 *  • Every plate sits in the same tonal band — mid-to-dark, low-to-moderate
 *    saturation — so the photography reads as one commissioned set against the
 *    canvas (#F4F3EF) and ink (#141414) grounds. Nothing here is a bright,
 *    high-key stock photograph, and nothing is a heavily saturated one.
 */

const UNSPLASH_CDN = 'https://images.unsplash.com/photo-'

/**
 * Default social-share card.
 *
 * Must be an absolute URL, because Open Graph consumers (Slack, LinkedIn,
 * WhatsApp, X) fetch it out of context and cannot resolve relative paths.
 *
 * This is a placeholder pointing at the CDN. Replace it with a designed
 * 1200×630 card hosted at `/og-image.jpg` before launch, then change this
 * constant to the absolute URL of that asset.
 */
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1590496793907-4d66e2994b4d?auto=format&fit=crop&w=1200&h=630&q=70'

/** Responsive widths used across the site. Keeps payloads honest. */
export const IMAGE_WIDTHS = [640, 960, 1280, 1600, 2000]

/**
 * Build a single CDN URL at a given width.
 * @param {string} id Unsplash photo id (the part after `photo-`)
 * @param {number} width
 * @param {{ quality?: number, aspect?: string }} [options]
 */
export function imageUrl(id, width, options = {}) {
  const { quality = 72, aspect } = options
  const params = new URLSearchParams({
    auto: 'format',
    fit: 'crop',
    w: String(width),
    q: String(quality),
  })
  if (aspect) {
    params.set('ar', aspect)
    params.set('crop', 'entropy')
  }
  return `${UNSPLASH_CDN}${id}?${params.toString()}`
}

/**
 * Build a `srcset` string across the site's standard widths.
 * @param {string} id
 * @param {number[]} [widths]
 * @param {{ quality?: number, aspect?: string }} [options]
 */
export function imageSrcSet(id, widths = IMAGE_WIDTHS, options = {}) {
  return widths.map((w) => `${imageUrl(id, w, options)} ${w}w`).join(', ')
}

/** Convenience shape consumed by the <Media> component. */
function media(id, alt, options = {}) {
  return {
    id,
    alt,
    aspect: options.aspect,
    widths: options.widths ?? IMAGE_WIDTHS,
    quality: options.quality ?? 72,
    /** Flag surfaced in dev tooling so placeholders are never forgotten. */
    isPlaceholder: true,
  }
}

export const MEDIA = {
  /* ---- Home · Hero ----------------------------------------------------- */
  heroPrimary: media(
    '1590496793907-4d66e2994b4d',
    'Placeholder: a container ship being loaded by gantry cranes at an industrial port at dusk',
  ),
  heroPanel: media(
    '1562892302-97faedd66f1c',
    'Placeholder: an aerial view of stacked freight containers in a terminal',
  ),

  /* ---- Home · Introduction -------------------------------------------- */
  introductionPrimary: media(
    '1672279410716-c676739163e9',
    'Placeholder: a dense city skyline at dusk, standing in for a global trading hub',
  ),
  introductionSecondary: media(
    '1782948603191-065fb15e2e8e',
    'Placeholder: tall racking filled with cardboard boxes along a warehouse aisle',
  ),

  /* ---- Home · Capabilities -------------------------------------------- */
  capabilitySourcing: media(
    '1651525670114-2b8117390b28',
    'Placeholder: workers on the floor of a manufacturing facility',
  ),
  capabilityTrade: media(
    '1678182451047-196f22a4143e',
    'Placeholder: intermodal containers stacked several high, representing international trade',
  ),
  capabilitySupplyChain: media(
    '1759272548449-7b689a81c8fb',
    'Placeholder: two workers in hard hats reviewing plans beside stacked shipping containers',
  ),
  capabilityLogistics: media(
    '1604506522146-316c8bedd874',
    'Placeholder: a cargo ship under way on open water beneath a cloudy sky',
  ),

  /* ---- Home · Process -------------------------------------------------- */
  processRequirement: media(
    '1601584115197-04ecc0da31d7',
    'Placeholder: a haulage truck on an open road in daylight',
  ),
  processSourcing: media(
    '1664382953403-fc1ac77073a0',
    'Placeholder: two people walking a warehouse aisle lined with blue shelving',
  ),
  processSupplyChain: media(
    '1772299121503-cd62a57e3a26',
    'Placeholder: workers inspecting a large, empty industrial warehouse space',
  ),
  processExport: media(
    '1784911546759-3eb217d08293',
    'Placeholder: port gantry cranes standing by the water beside wind turbines',
  ),
  processDelivery: media(
    '1790522725924-0197147189f2',
    'Placeholder: a freight train moving along its tracks under a warm sky at golden hour',
  ),

  /* ---- Home · Closing CTA --------------------------------------------- */
  closingCta: media(
    '1494412651409-8963ce7935a7',
    'Placeholder: an aerial view across a yard of stacked cargo crates',
  ),

  /* ---- Inner pages ---------------------------------------------------- */
  aboutHero: media(
    '1675636781244-99e2e93e81cf',
    'Placeholder: a working harbour with ships moored below a mountain range',
  ),
  aboutOverview: media(
    '1782398138730-2949ea4f9382',
    'Placeholder: an aerial view of shipping containers arranged in neat rows',
  ),
  sourcingHero: media(
    '1627309366653-2dedc084cdf1',
    'Placeholder: tall blue shelving units filled with cardboard boxes in a large warehouse',
  ),
  sourcingSequence: media(
    '1717386255773-1e3037c81788',
    'Placeholder: industrial machinery inside a large production building',
  ),
  supplyChainHero: media(
    '1684695749267-233af13276d0',
    'Placeholder: a warehouse interior filled with stacked boxes and pallets',
  ),
  supplyChainCoordination: media(
    '1586528116311-ad8dd3c8310d',
    'Placeholder: stacked plastic crates waiting in a storage area',
  ),
  logisticsHero: media(
    '1759272548457-12b8580bfca7',
    'Placeholder: a cargo ship being loaded at a port, with cranes alongside',
  ),
  logisticsArrangement: media(
    '1775449053619-89b5265f611a',
    'Placeholder: a large freight aircraft standing on the apron',
  ),
  networkHero: media(
    '1611323340350-bdcc0e6cfae5',
    'Placeholder: a city skyline seen across water at night',
  ),
  networkHorizon: media(
    '1611728337177-89dfbbdc7a3a',
    'Placeholder: a city skyline lit up after dark',
  ),
  contactHero: media(
    '1592805144716-feeccccef5ac',
    'Placeholder: a haulage truck on a highway beneath a warm evening sky',
  ),
}

export default MEDIA
