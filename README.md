# Afghan Futian — Website

Marketing site for **Afghan Futian**, an international sourcing, trading and supply
chain company working between China's supplier base and buyers worldwide.

The site is a single-page application with nine routed pages plus a 404: a
cinematic scroll narrative on the homepage, an editorial content page for each
service, and two legal documents (a privacy notice and terms of use). It is
built to be *handed over*: every piece of prose, every image and every contact
detail lives in one file per concern, so replacing placeholder content is a
targeted edit rather than a hunt.

> **Status:** design, content, animation, form and SEO work is complete. What
> remains before launch is the content swap described in
> [Before launch](#before-launch) — real photography, real contact details, the
> live domain — plus a legal review of the two draft documents in
> `src/data/legal.js`.

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | React 19 | — |
| Build | Vite 8 (Rolldown) | Fast, zero-config, first-class Tailwind plugin |
| Styling | Tailwind CSS 4 | Tokens declared in CSS via `@theme`, no JS config file |
| Routing | React Router 7 | Client-side routing with a shared persistent layout |
| Animation | GSAP 3 + `@gsap/react` | `useGSAP` handles cleanup; no animation leaks |
| Scroll | Lenis | Smooth scroll, driven by the GSAP ticker |
| Icons | `lucide-react` | Tree-shaken; only the icons actually used ship |
| Lint | oxlint | Fast, and the template default |

No CSS-in-JS, no component library, no state manager. The site is small enough
that those would be overhead.

---

## Requirements

- **Node 20.19+ or 22.12+** (Vite 8 requirement). Developed on Node 26.
- npm (a `package-lock.json` is committed).

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server with HMR, usually http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the built output locally
npm run lint      # oxlint
npm test          # unit tests (Node's built-in runner)
npm run check     # lint + test + build — the pre-commit / pre-deploy gate
```

`npm run dev` also starts a **development-only mock** of the contact endpoint, so
the enquiry form works end to end without a backend. See
[The contact form](#the-contact-form).

---

## Project structure

```
src/
├─ animations/     GSAP timelines, split by concern (hero, text, scroll)
├─ components/     Reusable UI: Button, Media, Navbar, Footer, form pieces …
├─ data/           ALL content. Prose, routes, contact details, media registry
├─ hooks/          useGSAP wrappers, smooth scroll, document metadata
├─ layouts/        MainLayout — the shell that persists across routes
├─ lib/            Framework-free helpers: gsap setup, motion, validation, api
├─ pages/          One component per route
├─ sections/       Homepage sections, composed in order by pages/Home.jsx
└─ styles/         index.css — the design system, and nothing else
```

Two folders exist beyond the originally specified set and are documented in their
file headers: `lib/` (pure helpers with no React dependency) and `hooks/`
(React-specific wrappers around them).

### The one rule that matters

**Components never contain copy.** Headings, paragraphs, labels, routes, image
descriptions and contact details all live under `src/data/`. If you are editing
prose, you should almost never be opening a `.jsx` file.

---

## How the site is put together

### Routing and the persistent shell

`src/App.jsx` holds the route table. Every route renders inside `MainLayout`
(`src/layouts/MainLayout.jsx`), which owns everything that must *not* remount on
navigation: the smooth-scroll provider, the preloader, the navbar, the closing
call to action, the footer and the custom cursor. Only the page body swaps.

Two details are deliberate:

- **The preloader plays once per session.** Once the visitor has navigated
  client-side there is nothing new to wait for, and replaying the curtain is the
  fastest way to make a site feel slow.
- **The closing CTA is global.** Every page should end with the same ask, so the
  block is rendered by the layout inside `<main>` rather than copied into each
  page. It is suppressed in two places: on `/contact`, where the reader is already
  on the page that block exists to send them to, and on the two legal documents,
  which are read for a specific clause and should end on the document rather than
  on a pitch.

`/services` redirects to `/sourcing` for backwards compatibility, and any unknown
path renders `NotFound`.

### Motion

- All GSAP is registered **once**, in `src/lib/gsap.js`.
- Components use the `useGSAP` hook from `@gsap/react`, which reverts its own
  context on unmount — there are no animation leaks to clean up by hand.
- `src/lib/motion.js` exposes `prefersReducedMotion()`. When it returns true the
  preloader is skipped entirely and animations resolve to their end state.
- Lenis is driven by `gsap.ticker` (its own RAF loop is disabled and
  `lagSmoothing(0)` is set) so smooth scroll and ScrollTrigger never disagree
  about scroll position. It is disabled under reduced motion.
- The Process section uses a **sticky progress rail** rather than a pinned
  horizontal scroll, specifically to avoid hijacking the scroll.
- **`<StrictMode>` is deliberately not used** (`src/main.jsx`). In development
  StrictMode mounts every component twice, and during that remount a
  ScrollTrigger context teardown can interleave with the second mount's
  synchronous trigger creation. ScrollTrigger walks its shared internal
  `_triggers` registry backwards by index while entries are being spliced out,
  reads `undefined`, and throws — which React surfaces as a render error. The
  race is inside ScrollTrigger, not application code, and it cannot occur in a
  production build (no double-mount), where the same navigation flow was
  verified clean. A comment in `src/main.jsx` records the full reasoning.
- The bespoke cursor (`src/components/CustomCursor.jsx`) renders its ring and dot
  as **siblings, not inside a wrapper**. A stacking context is an isolated group
  for blending, so a `position: fixed; z-index: …` wrapper would confine the
  children's `mix-blend-difference` to the wrapper's own transparent backdrop and
  the cursor would paint as plain white — invisible on the light canvas. Each
  element carries its own `z-index` instead; an element's *own* blend mode still
  reaches the page even when it creates a stacking context. The ring also
  switches to normal blending while it is filled with the accent, because
  difference-blending a brand colour produces an unrelated one.

### Document metadata

`src/hooks/useDocumentMeta.js` keeps `<title>`, description, canonical, Open
Graph and `robots` in step with the active route. Two behaviours worth knowing:

- `og:url` is set per route. Leaving the homepage's value everywhere makes social
  platforms attribute every shared link to the front door.
- A 404 is marked `noindex, nofollow` and its canonical is **removed**, so a
  crawler is not told that every missing URL duplicates `/`.

Crawlers that do not run JavaScript still receive the defaults baked into
`index.html`.

### Focus and scroll on navigation

`src/hooks/useSmoothScroll.jsx` handles both. On a route change focus moves to
`#main` with `preventScroll: true`, so keyboard and screen-reader users land in
the new page instead of at the top of the document. It is keyed on `pathname`
only and skipped on first render. Hash links (for example `/#process`) are
resolved with an offset for the fixed navbar.

---

## Content model

| File | Owns |
| --- | --- |
| `src/data/home.js` | Homepage prose |
| `src/data/pages.js` | Copy for the six inner routes |
| `src/data/services.js` | Service names, slugs, descriptions, the form's service options |
| `src/data/navigation.js` | Routes, nav, footer links, legal links, contact details, social links, page metadata |
| `src/data/media.js` | The photography registry and `DEFAULT_OG_IMAGE` |
| `src/data/contact.js` | Contact form fields and copy |
| `src/data/legal.js` | The privacy notice and terms of use, and the shared draft banner |

### Editorial rules

These are enforced by convention, and they are the reason the site reads the way
it does. Please keep them when editing copy:

- **No invented facts.** No history, founding dates, employee counts, offices,
  markets, certifications, client numbers, partners, routes, volumes or owned
  assets. Method is authorable; facts about the company are not, until Afghan
  Futian supplies them.
- **No implied assets.** No image may suggest the company owns vessels, aircraft,
  warehouses or vehicles. Imagery is illustrative of the *category* of work.
- **One subject per page, one tonal band.** No two photographs in the same page
  sequence may show the same subject — the homepage runs thirteen plates back to
  back, so a container ship cannot appear twice — and every plate sits in the same
  mid-to-dark, low-to-moderate-saturation band, so the set reads as one
  commissioned series rather than a pile of stock. Both rules are stated at the
  top of `src/data/media.js`.
- **Candour is the house style.** Where a page would naturally assert a fact we
  do not have, it says so explicitly instead of filling the gap with
  plausible-sounding language. The `ledger` blocks in `pages.js` pair "what this
  is" with "what this is not" for exactly this reason.

### Design tokens

All colour, type and motion tokens are declared once in `src/styles/index.css`
under `@theme`, and consumed through Tailwind utilities (`bg-canvas`, `text-ink`,
`font-display`, `text-hero`). The brand can be re-tuned from that single block.

```
canvas #F4F3EF   ink #141414   surface #E9E9E3   accent #D5FF55
muted  #777970   (large text only)   muted-strong #66665F   (small text)
line   rgb(20 20 20 / 0.14)
display 'Space Grotesk'   body 'Inter'   — only weights 400 and 500 are used
```

`#777970` is the specified secondary text colour, but it only reaches 4.07:1 on
the canvas — below WCAG AA for small text. Rather than silently changing the
brand value, it is kept for large text and `#66665F` is used wherever text is
small. That sibling clears AA on **both** light grounds the site ships
(5.2:1 on canvas, 4.7:1 on surface).

---

## The contact form

Client and server share one definition of a valid enquiry.

- **Fields** — `src/data/contact.js`.
- **Validation** — `src/lib/validation.js`. Pure functions: `validateField`,
  `validateForm`, `buildMailtoFallback`. No React, no DOM.
- **Submission** — `src/lib/api.js`.
- **UI** — `src/components/ContactForm.jsx` and `FormField.jsx`.

Behaviour that was designed rather than defaulted:

- **Validation runs on blur, not on keystroke.** A form that scolds you while you
  are still typing is worse than one that waits. Once a field has been flagged,
  it re-validates as you correct it.
- **Errors are announced.** A `role="alert"` summary lists every problem and links
  to the offending field; activating a link focuses that field.
- **Success replaces the form** with a `role="status"` panel, so the change is
  announced.
- **A failed submission never loses the enquiry.** Values are kept and a
  pre-filled `mailto:` fallback is offered.
- **A honeypot field (`website`) silently succeeds.** Bots fill it; people never
  see it. The client returns success without sending a request.

### API contract

Set `VITE_API_BASE_URL` to the API origin. When it is unset — the default — the
endpoint resolves to the site's own origin, which is what a reverse-proxied
deployment wants.

```
VITE_API_BASE_URL=https://api.afghanfutian.com   →  POST that origin + /api/contact
(unset)                                          →  POST same origin + /api/contact
```

```
POST {base}/api/contact
Content-Type: application/json

{
  "name": "…", "company": "…", "email": "…", "phone": "…",
  "country": "…", "service": "…", "message": "…",
  "meta": { "submittedAt": "…", "locale": "en-GB", "path": "/contact" }
}

201  { "ok": true,  "id": "<mongo ObjectId>" }
400  { "ok": false, "errors": { "<field>": "<message>" } }
429  { "ok": false, "errors": { "message": "…" } }
5xx  treated as a generic failure
```

The full contract — including the suggested MongoDB document and the
`ContactSubmitError.kind` values the UI responds to — is documented at the top of
`src/lib/api.js`. **Read that file before writing the server.**

### The dev mock

`vite.config.js` registers a plugin with `apply: 'serve'`, so a `POST
/api/contact` mock exists **only while `npm run dev` is running**. It is not part
of the build and cannot be deployed. It implements the same status codes and
error shape as the real contract, logs each enquiry to the terminal, and accepts
the honeypot silently.

The real handler must **import `validateForm` from `src/lib/validation.js`**
rather than copying the rules. The mock deliberately keeps its own reduced copy
only because importing application modules into `vite.config.js` drags their
extensionless imports into Vite's config loader, which warns on every build.

---

## Legal documents

`/privacy` and `/terms` are rendered by a single component, `LegalDoc`
(`src/components/LegalDoc.jsx`), from a single data file, `src/data/legal.js`.
Both are **drafts**, and the UI says so: a banner at the top of each page states
that the document has not been reviewed by a lawyer. **That banner must stay**
until a qualified lawyer has reviewed both against the law of the jurisdiction
Afghan Futian is registered in.

Why ship a draft at all? A contact form that collects a name, an email address
and a message is collecting personal data, and publishing nothing leaves the
visitor with no statement of what happens to it. So the site ships an honest
draft rather than silence, or a generic template copied from elsewhere.

Two rules govern the copy, and they are the same rules as the rest of the site:

- **Every statement is checkable against the code.** The fields the form collects
  come from `contact.js`; the third-party requests described are the Google Fonts
  and Unsplash CDN loads every page actually makes; the absence of cookies,
  analytics and tracking is a fact about this codebase.
- **Undecided things are written as undecided.** No retention period, no
  governing law and no registered entity have been invented. Each is named as
  pending, with a note on what has to be filled in before the site is published.

The layout is deliberately not the site's `PageHero`. A legal page is a document,
not a chapter opening, so it opens on the same ink ground but drops the
photograph and sets a sticky contents rail with a scroll-spy instead. The pages
are linked from the footer's legal bar, not the primary navigation.

---

## Tests

```bash
npm test
```

The enquiry pipeline is the only place in the site with real logic, so it is the
only place with tests. They run on **Node's built-in test runner** — no framework
is installed, which matches the project's stance on dependencies.

| File | Covers |
| --- | --- |
| `src/lib/validation.test.js` | `validateField`, `validateForm`, `buildMailtoFallback` |
| `src/lib/api.test.js` | payload shaping and every `ContactSubmitError` branch, with `fetch` stubbed |

`validation.js` and `api.js` import nothing, so they load in plain Node. The
field descriptors in the tests are declared inline rather than imported from
`src/data/contact.js`: that module uses bundler-style extensionless imports,
which Node's ESM resolver refuses — and the tests are about the *rules*, not the
copy, so a local fixture is the right boundary anyway.

Anything that needs the alias, JSX or a DOM would need a bundler-aware runner
(Vitest). Nothing currently does.

---

## Before launch

Everything below is a placeholder and is flagged as such in the code.

| What | Where | Replace with |
| --- | --- | --- |
| Photography (25 images) | `src/data/media.js` | Self-hosted, art-directed assets |
| Image `alt` text | `src/data/media.js` | A description of what the final image shows |
| Social share card | `DEFAULT_OG_IMAGE` in `src/data/media.js`, and `index.html` | A designed 1200×630 image at `/og-image.jpg` |
| Contact details | `CONTACT_DETAILS` in `src/data/navigation.js` | The real email, phone, address and hours |
| Social links | `SOCIAL_LINKS` in `src/data/navigation.js` | Real URLs (`href: null` renders as plain text) |
| Domain | `index.html`, `public/robots.txt`, `public/sitemap.xml` | The live hostname, everywhere |
| Legal documents | `src/data/legal.js` | A lawyer-reviewed privacy notice and terms; remove the draft banner only after review |

Images are served from the Unsplash CDN and centralised in `src/data/media.js`;
nothing else in the codebase hard-codes an image URL. Every image is marked
`isPlaceholder: true`.

The `Organization` JSON-LD in `index.html` is intentionally minimal — name,
description, url, logo and the areas of business. There is **no** `foundingDate`,
`address`, `telephone`, `sameAs` or `numberOfEmployees`, because none of those
have been confirmed. Publishing a placeholder address as schema is worse than
publishing nothing: search engines surface it verbatim. When the real details
exist, add them to `CONTACT_DETAILS` and mirror them in the same edit.

### Checklist

- [ ] Replace all 25 images and rewrite their `alt` text
- [ ] Design and host `/og-image.jpg`; point `DEFAULT_OG_IMAGE` and `index.html` at it
- [ ] Fill in `CONTACT_DETAILS` and `SOCIAL_LINKS`
- [ ] Have `src/data/legal.js` reviewed by a lawyer, fill in the retention period, governing law and registered entity, then remove the draft banner
- [ ] Update the email in the `<noscript>` block of `index.html` to match `CONTACT_DETAILS.email`
- [ ] Replace `afghanfutian.com` in `index.html`, `robots.txt` and `sitemap.xml`
- [ ] Add a `sitemap.xml` entry for any new route
- [ ] Build the Express + MongoDB service against the contract in `src/lib/api.js`
- [ ] Set `VITE_API_BASE_URL` in the hosting environment (or reverse-proxy `/api`)
- [ ] If the API is on another origin, add it to `connect-src` in `public/_headers` and `vercel.json`
- [ ] Delete the deployment configs for hosts you are not using
- [ ] Run `npm run check`
- [ ] Lighthouse on every route, at mobile and desktop

---

## Deployment

The site is a static build in `dist/`. The only hosting requirement is a **SPA
fallback**: every unknown path must serve `index.html`, or a hard refresh on
`/sourcing` returns a 404. Configs for the three common hosts are included — keep
the one you use and delete the rest.

| Host | Fallback | Headers |
| --- | --- | --- |
| Vercel | `vercel.json` → `rewrites` | `vercel.json` → `headers` |
| Netlify | `netlify.toml` → `[[redirects]]` | `public/_headers` |
| Cloudflare Pages | `public/_redirects` | `public/_headers` |

Response headers live in **`public/_headers`** rather than in `netlify.toml`, so
that Netlify and Cloudflare Pages share one definition instead of two that can
drift. Vercel does not support that file, so `vercel.json` mirrors it — **keep the
two in step.** They set:

- long-lived, immutable caching for fingerprinted assets under `/assets/`;
- forced revalidation of the HTML shell;
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Strict-Transport-Security`
  and a `Content-Security-Policy`.

The CSP is strict where it matters (`script-src 'self'` — no inline scripts are
shipped) and needs no `'unsafe-inline'` for styles, because React and GSAP write
styles through the CSSOM, which CSP does not govern. It was verified against the
production build in a browser: zero console violations, fonts and Unsplash
photography still load.

> **If you set `VITE_API_BASE_URL` to an origin other than the site's own, you
> must add it to `connect-src`** in `public/_headers` *and* `vercel.json`, or the
> browser will block every submission.

Environment variables are prefixed `VITE_` and read at build time — a change
requires a rebuild. See `.env.example`.

---

## Accessibility and performance notes

The current build measures **Lighthouse 1.0 / 1.0 / 1.0** on every route,
including the 404, with no horizontal overflow from 320px to 1440px. What gets
it there:

- Semantic landmarks (`<main>`, `<nav>`, `<footer>`), one `<h1>` per route, and
  alt text on every image.
- A visible focus ring on every interactive element; focus is moved to `#main`
  on navigation.
- Contrast measured, not eyeballed. See the token notes above.
- Below-fold images are lazy-loaded and served as `srcset` across five widths.
- Fonts are limited to the two weights actually used; heavy vendors (GSAP, Lenis)
  are split into their own chunks so first paint is not blocked.
- `prefers-reduced-motion` disables the preloader and resolves animations to
  their end state.
- If JavaScript is off, a `<noscript>` block in `index.html` still explains the
  situation and offers the contact address. Its styles are authored CSS in
  `src/styles/index.css`, not generated utilities, so they render from the
  stylesheet alone.
- A thrown render never produces a blank page. `src/components/ErrorBoundary.jsx`
  is mounted twice — once around the router in `main.jsx`, and once around
  `<Outlet/>` in `MainLayout` — so a failure inside one page leaves the navbar and
  footer intact and navigating away clears the error. The fallback focuses itself
  and uses plain links, and its dev-only stack trace is compiled out of the
  production bundle.

---

## Gotchas

- **Tailwind 4 has no `tailwind.config.js`.** Tokens live in `@theme` inside
  `src/styles/index.css`. Adding a config file will not do what you expect.
- **`@` is an alias for `src`**, configured in `vite.config.js`.
- **Never write two tweens to the same transform property.** Image reveals use a
  three-layer structure (clip-path frame, `yPercent` middle, `scale` inner)
  precisely so each tween owns its own property.
- **`react/only-export-components` warnings** in `useSmoothScroll.jsx` are
  expected: the file exports a provider plus two hooks. Splitting it would hurt
  readability more than the warning costs.
