/**
 * PHOTOGRAPHY REGISTRY — LOCALLY HOSTED, LICENSED ASSETS
 * ============================================================================
 * Every photograph is self-hosted under `public/images/{section}/` and emitted
 * as WebP variants at 640, 960, 1280, 1600 and 2000 px where the source
 * resolution allows. Nothing in this file points at a third-party CDN.
 *
 * The `id` on each entry is the path (relative to `/images/`) of the asset
 * *without* the `-{width}.webp` suffix — `imageUrl()` appends it. Full provenance,
 * licence and attribution for every file is recorded in `IMAGE-SOURCES.md`.
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

/**
 * Default social-share card. Absolute URL because Open Graph consumers (Slack,
 * LinkedIn, WhatsApp, X) fetch it out of context and cannot resolve a relative
 * path. The file is generated from the hero photograph at 1200×630.
 */
export const DEFAULT_OG_IMAGE = 'https://afghanfutian.com/og-image.jpg'

/** Responsive widths used across the site. Keeps payloads honest. */
export const IMAGE_WIDTHS = [640, 960, 1280, 1600, 2000]

/**
 * Build the local URL for one image at a given width.
 * @param {string} id Path relative to /images/, without the width suffix
 * @param {number} width
 * @param {{ quality?: number, aspect?: string }} [_options] Kept for API parity
 */
export function imageUrl(id, width, _options = {}) {
  return `/images/${id}-${width}.webp`
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

/**
 * Intrinsic dimensions of each image's largest rendition, used for explicit
 * `width`/`height` attributes on the <img> so the browser can reserve space
 * before the bytes arrive (CLS prevention).
 */
const DIMENSIONS = {
  'home/container-terminal-aerial': [2000, 1333],
  'global-network/ningbo-beilun-port-aerial': [2000, 730],
  'home/shanghai-pudong-skyline': [2000, 1000],
  'home/high-bay-warehouse-racking': [1280, 1971],
  'home/china-production-line': [2000, 1500],
  'home/kwai-tsing-container-terminal': [2000, 1500],
  'home/factory-quality-inspection': [1600, 1138],
  'home/ocean-cargo-ship': [1600, 1089],
  'home/business-requirements-meeting': [2000, 1335],
  'home/yiwu-trade-market-gate': [2000, 1500],
  'home/pallet-rack-warehouse': [1600, 1247],
  'home/yantian-port-cranes': [1600, 900],
  'home/intermodal-rail-freight': [2000, 1333],
  'home/container-terminal-night': [2000, 1333],
  'about/kabul-market-scene': [1600, 1200],
  'about/yiwu-trade-mart': [2000, 1329],
  'sourcing/automated-warehouse': [1600, 804],
  'sourcing/china-production-line-packing': [2000, 1500],
  'supply-chain/automated-storage-system': [1600, 900],
  'supply-chain/packing-line': [2000, 900],
  'logistics/container-ship-koper': [2000, 1315],
  'logistics/korean-air-cargo-747': [2000, 1289],
  'global-network/shanghai-bund-night': [2000, 651],
  'global-network/shenzhen-skyline': [2000, 1500],
  'contact/intermodal-freight-train': [2000, 1333],
  'about/busy-kabul-market': [2000, 1500],
  'sourcing/china-factory-workshop': [2000, 1500],
  'supply-chain/warehouse-robots': [1600, 1101],
  'logistics/cargo-aircraft-liege': [2000, 1125],
  'global-network/beijing-cbd-skyline': [2000, 1333],
}

/** Convenience shape consumed by the <Media> component. */
function media(id, alt, options = {}) {
  const [width, height] = DIMENSIONS[id] ?? [1600, 1067]
  return {
    id,
    alt,
    width,
    height,
    aspect: options.aspect,
    widths: options.widths ?? IMAGE_WIDTHS,
  }
}

export const MEDIA = {
  /* ---- Home · Hero ----------------------------------------------------- */
  heroPrimary: media(
    'home/container-terminal-aerial',
    'Aerial view of shipping containers and gantry cranes at a container terminal',
  ),
  heroPanel: media(
    'global-network/ningbo-beilun-port-aerial',
    'Aerial view of container berths at Beilun Port in Ningbo, China',
  ),

  /* ---- Home · Introduction -------------------------------------------- */
  introductionPrimary: media(
    'home/shanghai-pudong-skyline',
    'Panoramic view of the Pudong skyline in Shanghai',
  ),
  introductionSecondary: media(
    'home/high-bay-warehouse-racking',
    'Tall racking inside a high-bay warehouse',
    // Source thumbnail is 1280 px wide.
    { widths: [640, 960, 1280] },
  ),

  /* ---- Home · Capabilities -------------------------------------------- */
  capabilitySourcing: media(
    'home/china-production-line',
    'Workers operating a food production line in Guangdong, China',
  ),
  capabilityTrade: media(
    'home/kwai-tsing-container-terminal',
    'Rows of shipping containers at the Kwai Tsing container terminal in Hong Kong',
  ),
  capabilitySupplyChain: media(
    'home/factory-quality-inspection',
    'Garment worker checking a T-shirt during quality control in a factory',
    { widths: [640, 960, 1280, 1600] },
  ),
  capabilityLogistics: media(
    'home/ocean-cargo-ship',
    'A large ocean-going cargo ship at sea',
    { widths: [640, 960, 1280, 1600] },
  ),

  /* ---- Home · Process -------------------------------------------------- */
  processRequirement: media(
    'home/business-requirements-meeting',
    'Business professional taking notes during a meeting at a modern office desk',
  ),
  processSourcing: media(
    'home/yiwu-trade-market-gate',
    'Entrance to District 3 of Yiwu International Trade Market in China',
  ),
  processSupplyChain: media(
    'home/pallet-rack-warehouse',
    'Pallet racking and stored goods inside a modern warehouse',
    { widths: [640, 960, 1280, 1600] },
  ),
  processExport: media(
    'home/yantian-port-cranes',
    'Container cranes and berths at Yantian port in Shenzhen',
    { widths: [640, 960, 1280, 1600] },
  ),
  processDelivery: media(
    'home/intermodal-rail-freight',
    'Intermodal freight containers stacked on railway flat cars',
  ),

  /* ---- Closing CTA · one per page ------------------------------------- */
  closingCta: media(
    'home/container-terminal-night',
    'Container terminal lit up at night',
  ),
  closingCtaAbout: media(
    'about/busy-kabul-market',
    'Crowded market street in Kabul, Afghanistan',
  ),
  closingCtaSourcing: media(
    'sourcing/china-factory-workshop',
    'Production machinery on a factory floor in Guangdong, China',
  ),
  closingCtaSupplyChain: media(
    'supply-chain/warehouse-robots',
    'Robots moving goods in an automated warehouse',
    { widths: [640, 960, 1280, 1600] },
  ),
  closingCtaLogistics: media(
    'logistics/cargo-aircraft-liege',
    'Cargo Boeing 747 parked on the apron at Liège Airport',
  ),
  closingCtaNetwork: media(
    'global-network/beijing-cbd-skyline',
    "Skyline of Beijing's central business district",
  ),

  /* ---- Inner pages ---------------------------------------------------- */
  aboutHero: media(
    'about/kabul-market-scene',
    'Stalls and shoppers at a busy market in Kabul',
    { widths: [640, 960, 1280, 1600] },
  ),
  aboutOverview: media(
    'about/yiwu-trade-mart',
    'Exterior of District 3 at Yiwu International Trade Mart in China',
  ),
  sourcingHero: media(
    'sourcing/automated-warehouse',
    'Automated high-bay warehouse with stacker cranes',
    { widths: [640, 960, 1280, 1600] },
  ),
  sourcingSequence: media(
    'sourcing/china-production-line-packing',
    'Production-line equipment inside a Guangdong food factory',
  ),
  supplyChainHero: media(
    'supply-chain/automated-storage-system',
    'Automated storage and retrieval system in a distribution facility',
    { widths: [640, 960, 1280, 1600] },
  ),
  supplyChainCoordination: media(
    'supply-chain/packing-line',
    'Packing area with conveyor lines and packaged goods in a factory',
  ),
  logisticsHero: media(
    'logistics/container-ship-koper',
    'Container ship MSC Harmony III berthed at the Port of Koper',
  ),
  logisticsArrangement: media(
    'logistics/korean-air-cargo-747',
    'Korean Air cargo Boeing 747 parked at Amsterdam Schiphol Airport',
  ),
  networkHero: media(
    'global-network/shanghai-bund-night',
    'The Shanghai skyline and Bund waterfront at night',
  ),
  networkHorizon: media(
    'global-network/shenzhen-skyline',
    'Modern high-rise skyline in Shenzhen, China',
  ),
  contactHero: media(
    'contact/intermodal-freight-train',
    'Freight train carrying intermodal containers in Pyhäsalmi, Finland',
  ),
}

export default MEDIA
