# Afghan Futian — Website

Marketing site for **Afghan Futian**, a trading company that sources products in
China and coordinates trade documents and cargo movement for buyers in Afghanistan
and other agreed markets.

The site is a single-page application with ten routed pages plus a 404: a
cinematic scroll narrative on the homepage, an editorial content page for each
service, a meeting-booking page, and two legal documents (a privacy notice and
terms of use). It is built to be *handed over*: every piece of prose, every image
and every contact detail lives in one file per concern, so replacing placeholder
content is a targeted edit rather than a hunt.

The site ships in English, Pashto and Afghan Dari. See
[I18N.md](I18N.md) for URL patterns, dictionaries, RTL, fonts, the Cal.com
limitation and the remaining native-speaker review items.

> **Status:** design, content, animation, form and SEO work is complete. The
> enquiry form and the meeting-booking page are wired to real services — a
> Vercel Function sending through Resend, and a Cal.com embed — and both are
> **code-complete but unverified against a live account**, because they need
> credentials this repository does not ship. See
> [Enquiry email](#enquiry-email) and [Scheduling](#scheduling) for exactly what
> to set. What remains besides that is the content swap described in
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
| Localisation | `i18next` + `react-i18next` | English, Pashto and Afghan Dari from one page implementation |
| Enquiry email | Resend, via a Vercel Function | Server-side key, no database, one file |
| Scheduling | Cal.com, in a plain `<iframe>` | Real availability without a third-party script in the page |
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
api/
└─ contact.js      The only server-side code: POST /api/contact (Vercel Function)

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
(React-specific wrappers around them). `api/` sits outside `src/` on purpose:
Vercel serves any file under it at the matching path, and it must not be part of
the client bundle.

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
display/body 'Vazirmatn'   Arabic fallback 'Noto Sans Arabic'   — local OFL WOFF2
```

`#777970` is the specified secondary text colour, but it only reaches 4.07:1 on
the canvas — below WCAG AA for small text. Rather than silently changing the
brand value, it is kept for large text and `#66665F` is used wherever text is
small. That sibling clears AA on **both** light grounds the site ships
(5.2:1 on canvas, 4.7:1 on surface).

### Brand assets

The mark is raster artwork — a wide device whose ink is 1611×1074, an aspect of
**1.50:1**. That ratio is the whole reason the lockup is sized the way it is: a
1.5:1 mark drawn inside a square box only fills two thirds of the box's height,
which is what made an earlier revision look undersized.

| File | Size | Ground | Used by |
| --- | --- | --- | --- |
| `public/favicon.png` | 512×512 | any | browser tab, `apple-touch-icon`, JSON-LD `logo` |
| `public/logo-mark.png` | 192×128 | light | the navbar once it goes solid |
| `public/logo-mark-light.png` | 192×128 | ink | navbar over the hero, mobile overlay, footer |

Three of the four lockups sit on the ink ground, where the navy artwork would
disappear. `logo-mark-light.png` is the same artwork rendered in canvas cream,
which keeps every stroke legible. A CSS filter would not: `brightness(0)
invert(1)` collapses the mark's many strokes into one silhouette, and a plain
`invert` turns navy into pale yellow.

All three are generated from a single source by
`scripts/build_logo_assets.py` — `python3 scripts/build_logo_assets.py
path/to/source.png`. The source is cropped to its ink, the true 1.50:1 aspect is
preserved, and the favicon is composed as a square tile with the mark filling
90% of its width, so the mark fills the browser tab rather than floating in a
sea of padding. (The script needs macOS `sips` to decode the source and nothing
else — the PNGs are written by a small encoder it carries.)

`Logo` takes `onDark` to choose between the two marks, and `size` (`md` by
default, `lg`) to scale the lockup. If the artwork is ever replaced, regenerate
all three files from the new original rather than editing one by hand, so the
set cannot drift apart.

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

---

## Enquiry email

The form posts to `POST /api/contact` **on the site's own origin**. `api/contact.js`
is a Vercel Function, and Vercel serves any file under `api/` at the matching
path — so that file *is* the endpoint. There is no router to configure and no
separate service to deploy.

### The contract

```
POST {base}/api/contact
Content-Type: application/json

{
  "name": "…", "company": "…", "email": "…", "phone": "…",
  "country": "…", "service": "…", "message": "…", "website": "",
  "meta": {
    "submittedAt": "…",  "startedAt": "…",
    "locale": "en-GB",   "path": "/contact"
  }
}

201  { "ok": true,  "id": "<provider message id>" }      accepted by the mail service
201  { "ok": true,  "id": "…", "duplicate": true }       the same enquiry, seen again
201  { "ok": true,  "id": null }                         silent bot drop — the UI reports failure
400  { "ok": false, "errors": { "<field>": "<message>" } }
405  method not allowed
413  body too large
429  { "ok": false, "errors": { "message": "…" } }       rate limited
502  { "ok": false, "errors": { "message": "…" } }       the mail service refused it
503  { "ok": false, "errors": { "message": "…" } }       not configured (no API key)
```

`{base}` is `VITE_API_BASE_URL` when it is set, and the site's own origin
otherwise. **With the bundled Vercel Function, leave `VITE_API_BASE_URL` unset** —
same origin is exactly what you want, and it keeps the CSP's `connect-src` at
`'self'`.

`startedAt` is recorded when the visitor first touches the form; `submittedAt`
is created when the request is built. They must not be the same value — the
timing guard measures the gap between them, and using the submission timestamp
alone drops every genuine enquiry.

The UI shows its success panel only for a `201` carrying a real provider id, so
a green tick always means a real handoff. A `201` with `id: null` is a silent bot
drop and is surfaced as an error with a `mailto:` fallback. The
`ContactSubmitError.kind` values the UI branches on are documented at the top of
`src/lib/api.js`.

### What the function does

In order: reject non-POST → parse with a 64 KB ceiling → drop silent bot traffic
(a filled honeypot, or a form completed in under three seconds, measured from
`meta.startedAt`) → validate with **the same `validateForm` the browser uses** →
sanitise every field → rate-limit per client and de-duplicate identical
enquiries → send the notification and the visitor's confirmation.

Function logs use reason codes (`drop reason=…`, `accepted notification id=…`,
`failed confirmation status=…`). They deliberately contain no names, addresses,
message bodies, API keys or raw client addresses; the provider message id is
recorded on acceptance so a Resend log can be matched to a submission.

Two details worth knowing:

- **There is no second copy of the validation rules.** `api/contact.js` imports
  `validateForm` from `src/lib/validation.js` and `CONTACT_FORM_FIELDS` from
  `src/data/contact.js`, so client and server cannot disagree about what a valid
  enquiry is. The service list is imported rather than repeated too — it lives in
  `src/data/serviceOptions.js`, a leaf module with no imports of its own, because
  the function runs on plain Node ESM, which requires explicit file extensions
  and must not be handed the whole content graph.
- **The visitor's address becomes the `Reply-To`** on the notification, so
  replying in the company inbox answers the visitor directly. The confirmation
  the visitor receives carries `Reply-To: contact@afghanfutian.com`.

> **Rate limiting is best-effort, and that is stated rather than hidden.** The
> counters live in a module-scope `Map`. A serverless platform may run several
> instances of the function, each with its own memory, so the limits hold per
> instance. That stops a script hammering the form from one place; it is not a
> substitute for a shared store (Vercel KV, Upstash, Redis) if the form is ever
> attacked in earnest. Swapping the `Map` for a store is a change to two helpers.

### Setting up Resend

The code is complete; it needs an account.

1. Create an account at <https://resend.com> and add the sending domain
   (`afghanfutian.com`) under **Domains**. Resend prints DNS records — add them
   at your DNS provider and wait until the domain reads **Verified**. Nothing
   will send until this is done.
2. Create an API key at <https://resend.com/api-keys>.
3. In Vercel → your project → **Settings → Environment Variables**, set
   `RESEND_API_KEY`. Set `CONTACT_FROM_EMAIL` if you want a sender other than the
   default, and `CONTACT_TO_EMAIL` only if enquiries should go somewhere other
   than `contact@afghanfutian.com`.
4. Redeploy. `VITE_*` variables are baked in at build time; these are read at
   runtime, so a redeploy is only needed because one accompanies the change.

Then verify it for real: submit the live form and confirm **two** messages arrive
— the notification in the company inbox, and the confirmation at the address you
typed. Check the spam folder too; if the messages land there, mark them as *not
spam* and add the sender to the mailbox's contacts. Authentication records are
on `send.afghanfutian.com` (SPF/MX) and `resend._domainkey.afghanfutian.com`
(DKIM) — do not add Resend to the root domain's SPF, which must keep authorising
Hostinger's mail server. Until both messages have been seen, treat the
integration as unverified.

### The dev mock

`vite.config.js` registers a plugin with `apply: 'serve'`, so a `POST
/api/contact` mock exists **only while `npm run dev` is running**. It is not part
of the build and cannot be deployed. It implements the same status codes and
error shape, logs each enquiry to the terminal, and accepts the honeypot
silently — so the form can be worked on with no Resend key at all.

The mock keeps its own reduced copy of the rules rather than importing them,
because importing application modules into `vite.config.js` drags their
extensionless imports into Vite's config loader, which warns on every build. The
real handler has no such constraint, and shares the real rules.

---

## Scheduling

"Schedule a Meeting" — in the navbar, the overlay menu, the contact page and the
closing call to action — leads to `/schedule`, which embeds **Cal.com's official
booker** in a plain iframe. Cal.com owns the complete attendee flow: real
availability, date and time selection, the details form, confirmation, Google
Meet details, and the reschedule/cancel links in its confirmation email.

The following first-party endpoints are preserved for branded company mail,
webhooks and management capabilities; the embedded booker does not call them:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/schedule/availability` | Real slots from Cal.com API v2, filtered by the 120-minute notice rule and grouped in the visitor's timezone. |
| `POST /api/schedule/book` | Re-checks the exact slot, then creates a real Cal.com booking. It reports success only after a provider UID comes back. |
| `GET /api/schedule/manage` | Reads one booking using a signed capability, including links included in branded company templates. |
| `POST /api/schedule/cancel` / `reschedule` | Cancels or moves that real booking after re-validating the token and the new slot. |
| `POST /api/schedule/webhook` | Verified Cal.com lifecycle events, with provider-source markers so our own bookings are not double-notified. |
| `GET /api/schedule/reminder` | Optional, secret-protected reconciliation fallback. Not scheduled by default. |

All of those public URLs still work, but the deployment now has only three
functions: `api/contact.js`, `api/schedule.js` and `api/webhook.js`.
`vercel.json` rewrites `/api/schedule/<endpoint>` to the consolidated function
before the React SPA fallback, and `server/scheduleRouter.js` dispatches to the
preserved handler in `server/handlers/`. The webhook keeps its public address
and is rewritten to `api/webhook.js`, which verifies the exact raw bytes before
parsing any event.

`src/data/scheduling.js` holds the public Cal.com event URL and booker copy.
`server/lib/schedulingServer.js` holds every secret and is imported **only** by
server handlers and the three functions above. The browser bundle contains no
API key, webhook secret or Resend key. The CSP allows only
`frame-src https://cal.com`; no third-party script or inline style is allowed.

These three functions are enough for the whole site, including the enquiry form
and every schedule operation. Tests, helpers and internal handlers live under
`server/`, so none of them are deployable function entry points.

### Setting up Cal.com

1. Connect the calendar that actually holds the company's availability. That
   connection is what makes the slots real; Cal.com will not offer a taken time.
2. Confirm event type `7982708` (`afghanfutian/meeting`): 30 minutes, Google Meet,
   free, cancellation and rescheduling enabled, minimum notice 120 minutes. Add
   the booking questions in Cal.com: **Name** and **Email** are built in;
   optional **Company / organisation** and **Anything else**, and required
   **Purpose of the meeting**, are custom fields. Confirm the location is
   **Google Meet**.
3. Set the host availability timezone in Cal.com: **Event Types → meeting →
   Availability**, choose the schedule, set its timezone to
   **(GMT+04:30) Kabul**, and save. Also open **Settings → My account → General →
   Time zone** and set it to **(GMT+04:30) Kabul**, otherwise weekly hours are
   interpreted in the wrong zone. Optionally enable
   **Event Types → meeting → Timezone lock** if every meeting must stay in
   Kabul; leave it off to preserve the visitor's manual selector.
4. Set `VITE_CAL_LINK=https://cal.com/afghanfutian/meeting` in Vercel. It is
   public and baked into the bundle at build time, so changing it requires a
   redeploy. With it unset, `/schedule` shows the honest "not connected" state.
5. Create a Cal.com API key (**Settings → Developer → API keys**) and set
   `CAL_API_KEY` in Vercel. Set `CAL_EVENT_TYPE_ID=7982708` explicitly. These are
   required by the preserved branded-email webhook and management endpoints.
6. Set `SCHEDULE_TOKEN_SECRET` to a long random string. It signs the management
   capability used by the preserved endpoints and branded company notices. Do
   not rotate it casually: old links stop working when it changes.
7. Redeploy and open `/schedule`. The official Cal.com booker loads in the
   iframe with `cal.tz=Asia%2FKabul`, Cal.com's current query key for the booker's
   initial timezone, so it opens on **Kabul, Afghanistan (GMT+04:30)**. Its own
   selector lets visitors change timezone. Cal.com owns availability, booking,
   confirmation, Google Meet details and the reschedule/cancel links. Verify the
   value reached production by opening the deployed `/assets/index-*.js` bundle
   and searching for `afghanfutian/meeting`.

### Email ownership and duplicate prevention

This account's current plan matters, so it is stated plainly:

- Cal.com's **host** notifications can be switched off per channel under
  *Settings → My account → Notifications* on any plan. Our company notification
  is therefore never a duplicate of a provider host email.
- An attendee **confirmation** can be disabled on a booking link only when a
  workflow email is enabled for that link. On Cal.com's Free plan, workflow
  emails use the default template text and cannot be customised, so turning the
  built-in confirmation off still leaves a Cal.com-branded message.
- Guest **cancellation** and **rescheduling** notifications can be disabled only
  for organisations, by an organisation admin. Custom SMTP is also
  organisations-only.
- "Remove Cal.com branding" is listed on Teams ($12/user/month) and above, but
  the official documentation describes it as removing branding from public
  booking pages, not necessarily from notification email bodies.
- Cal.com's **calendar invite templates** can be edited on a Link, including the
  manage link, but the official help desk states that invites are sent as plain
  text. They cannot carry our full HTML email design.
- The official **Guest notification settings** page confirms that disabling
  attendee confirmation/cancellation/rescheduling mail is an Organization
  setting, available only to organization admins. Custom SMTP is also
  organization-only.
- Cal.com's official **Workflows** page confirms the Free plan can build
  workflows, but email-step copy uses the default template and cannot be
  edited; custom email content starts on Teams.

Sources checked for these statements in November 2026: [pricing](https://cal.com/pricing),
[disable confirmation emails](https://cal.com/help/event-types/disable-confirmation),
[guest notification settings](https://cal.com/help/enterprise/guest-notification-settings),
[calendar invites](https://cal.com/help/event-types/calendar-invites), and
[workflows](https://cal.com/help/workflows/workflowsoverview).

Because of that, branded attendee mail is **off by default**. Set
`SCHEDULE_SEND_ATTENDEE_EMAILS=true` only after you have actually disabled
Cal.com's attendee emails, or after accepting a paid plan that lets you replace
them. With it unset, Cal.com owns attendee mail and our branded company notice
is still sent. No duplicate confirmation is produced by this codebase.

These templates are branded, but they do **not** make the current Free account
fully white-label. Cal.com's own notification infrastructure and plain-text
calendar invites remain in place until the operator upgrades and reconfigures
the provider. The flag is deliberately not enabled by default.

Cal.com's confirmation carries its own cancel and reschedule links; those are
the attendee-facing management flow for bookings made in the embedded booker.
The preserved server endpoints and branded company templates still use signed
capabilities for webhook notifications and direct API management. When branded
attendee mail is enabled, those templates include the signed link too.

`RESEND_API_KEY` is required for any scheduling email; without it the booking
still succeeds but the response reports the mail failure. The sender defaults to
`Afghan Futian <contact@afghanfutian.com>` and must be a verified Resend sender.
Deterministic `Idempotency-Key` values prevent duplicate sends on retries, and
24-hour reminders use Resend `scheduledAt` (up to 30 days ahead) so no cron job
or database is needed.

### Webhook setup

1. In Cal.com, add a webhook pointing to
   `https://afghanfutian.com/api/schedule/webhook`.
2. Subscribe to `BOOKING_CREATED`, `BOOKING_CANCELLED` and `BOOKING_RESCHEDULED`.
3. Copy its signing secret into `CAL_WEBHOOK_SECRET` in Vercel. The endpoint
   rejects every request whose `x-cal-signature-256` does not verify against the
   raw bytes.

Bookings made through this site carry `metadata.source = 'website'`; their
branded emails are sent by the booking endpoint, so the webhook skips them and
only sends the company notice for bookings created directly in Cal.com.

### Known operational limits

- The rate limiter, duplicate-request guard and webhook dedupe map are
  process-local. A serverless deployment can have several instances, so a
  persistent store would be needed for a strict global guarantee. Cal.com's own
  conflict checks and Resend idempotency keys remain the authoritative guards.
- Cancelling a Resend scheduled reminder works only while its 24-hour
  idempotency key is still retained. The optional secret-protected
  `/api/schedule/reminder` endpoint reconciles by asking Cal.com for upcoming
  bookings instead. No cron is configured.
- Vercel's Hobby plan allows at most 12 Serverless Functions per deployment.
  The earlier layout put every file under `api/` — including tests and helpers —
  in the function count, so the scheduler deployment was rejected. It is now
  three functions by design, verified by `server/architecture.test.js`.
- Vercel's Hobby terms restrict that plan to personal or non-commercial use.
  This is a company website, so the project requires Vercel Pro ($20 per
  developer seat/month) or another commercial hosting plan before production.
  Lowering the function count fixes the deployment error; it does **not** make
  Hobby commercially licensed.

---

## Environment variables

Every variable, with the one thing that is easy to get wrong. Copy
`.env.example` to `.env.local` for local work; set the secrets in the host's
dashboard.

| Variable | Kind | Required | Notes |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | public, build-time | no | Leave unset with the bundled function (same origin). |
| `VITE_CAL_LINK` | public, build-time | for the embed | Official Cal.com event rendered on `/schedule`; requires a rebuild. |
| `RESEND_API_KEY` | secret, runtime | for email | Both contact and scheduling functions need it. |
| `CONTACT_TO_EMAIL` | secret, runtime | no | Company inbox for both forms. Defaults to `contact@afghanfutian.com`. |
| `CONTACT_FROM_EMAIL` | secret, runtime | no | Contact-form sender; must be verified in Resend. |
| `CONTACT_ALLOWED_ORIGIN` | secret, runtime | no | Only for a cross-origin setup (`VITE_API_BASE_URL` set). |
| `CAL_API_KEY` | secret, runtime | for scheduling | Cal.com API key. Never a `VITE_` variable. |
| `CAL_EVENT_TYPE_ID` | secret, runtime | no | Default `7982708`. |
| `CAL_WEBHOOK_SECRET` | secret, runtime | for webhook | Write-only Cal.com signing secret. |
| `SCHEDULE_TOKEN_SECRET` | secret, runtime | for manage links | Long random value. Falls back to `CAL_API_KEY` only as a convenience. |
| `SCHEDULE_FROM_EMAIL` | secret, runtime | no | Defaults to `Afghan Futian <contact@afghanfutian.com>`. |
| `SCHEDULE_SEND_ATTENDEE_EMAILS` | secret, runtime | no | `true` only after provider attendee mail is disabled. Default `false`. |
| `CAL_API_VERSION` / `CAL_API_BASE_URL` | secret, runtime | no | Provider overrides; leave empty for official v2. |
| `CRON_SECRET` | secret, runtime | no | Only for the optional reconciliation endpoint. |

`VITE_*` values are **inlined into the browser bundle at build time** — they are
public by definition, and changing one requires a rebuild. Everything else is
read by the function at **runtime** and never reaches the browser.

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
  come from `contact.js`; the only third-party asset request described is the
  Unsplash CDN photography a page actually makes (fonts are served locally); the absence of cookies,
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

Tests run on **Node's built-in test runner** — no framework is installed, which
matches the project's stance on dependencies. The script scans `src/` and
`server/`; nothing under `api/` is a test:

| File | Covers |
| --- | --- |
| `src/lib/validation.test.js` | `validateField`, `validateForm`, `buildMailtoFallback` |
| `src/lib/api.test.js` | payload shaping and every `ContactSubmitError` branch, with `fetch` stubbed |
| `src/lib/scheduling.test.js` | timezone and bookable-slot helpers used by the preserved backend handlers |
| `src/lib/schedulingSecrets.test.js` | no secret or server-only module leaks into the browser tree |
| `server/contact.test.js` | the enquiry endpoint: method guard, honeypot, fill-time, validation, both email payloads, de-duplication, rate limiting, and refusal to report a failed send as success |
| `server/handlers/*.test.js` | availability, booking, manage/cancel/reschedule, CORS and signed webhook behaviour |
| `server/lib/schedulingMailer.test.js` | branded templates, Resend idempotency and scheduled reminders |
| `server/scheduleRouter.test.js` | all public schedule routes resolve and delegate correctly |
| `server/architecture.test.js` | only three functions live in `api/` and their rewrites precede the SPA fallback |

`server/contact.test.js` calls the handler directly with a fake request and
response, and stubs `fetch`, so it never contacts Resend. That is what makes the
server-side behaviour verifiable without an account — the only thing it cannot
prove is that Resend accepts a real message from a verified domain, which needs
the credentials described under [Enquiry email](#enquiry-email).

`validation.js` and `api.js` import nothing, so they load in plain Node. The
field descriptors in the tests are declared inline rather than imported from
`src/data/contact.js`: the tests are about the *rules*, not the copy, so a local
fixture is the right boundary. `api/contact.js` is different — it deliberately
imports the real `validateForm`, and its test imports the real handler, so
nothing about the server is mocked except the network.

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
- [ ] Add a `sitemap.xml` entry for any new route, with `hreflang` alternates for `en`, `ps`, `fa-AF` and `x-default`
- [ ] Have the Pashto and Afghan Dari copy reviewed by native speakers (see [I18N.md](I18N.md))
- [ ] Set `RESEND_API_KEY` (and a verified `CONTACT_FROM_EMAIL`) in the host's dashboard, then submit the live form and confirm both emails arrive
- [ ] Confirm the Cal.com event type and Kabul host timezone, set `VITE_CAL_LINK`, rebuild, and confirm the embedded booker loads and a real booking lands on the calendar
- [ ] Leave `VITE_API_BASE_URL` unset for the bundled function — or, if the API is elsewhere, set it and add that origin to `connect-src` in `public/_headers` and `vercel.json`
- [ ] Delete the deployment configs for hosts you are not using
- [ ] Run `npm run check`
- [ ] Lighthouse on every route, at mobile and desktop

---

## Deployment

The site is a static build in `dist/`, **plus three serverless functions**:
`api/contact.js`, `api/schedule.js` and `api/webhook.js`. Two hosting
requirements:

1. A **SPA fallback**: every unknown path must serve `index.html`, or a hard
   refresh on `/sourcing` returns a 404.
2. The fallback must **not swallow `/api/`**. On Vercel the rewrite is therefore
   scoped with a negative lookahead:

   ```
   { "source": "/:path((?!api/).*)", "destination": "/index.html" }
   ```

   Without it, `POST /api/contact` would be rewritten to `index.html` and the
   function would never run.

Vercel is the host this project is built for — it is the only one of the three
with a functions runtime, and the contact and schedule endpoints need one.
Configs for the other hosts remain in the repository but would need those
endpoints hosted separately (and `VITE_API_BASE_URL` pointed at them).

Vercel publishes every `.js` file under `api/` as a function. Tests and helpers
therefore live in `server/`, and **`.vercelignore` keeps any stray test out as a
second line of defence**. The earlier layout had 14 deployable files under
`api/`: `contact.js`, plus seven schedule handlers, five test files and one
helper nested under `api/schedule/`. The old `api/*.test.js` ignore rule matched
only the top-level `contact.test.js`, so all 14 counted against the Hobby plan's
limit of 12. Consolidation to three entry points removes that failure without
changing any public URL.

| Host | Fallback | Headers | Function |
| --- | --- | --- | --- |
| Vercel | `vercel.json` → `rewrites` | `vercel.json` → `headers` | `api/` → `/api/*` |
| Netlify | `netlify.toml` → `[[redirects]]` | `public/_headers` | not included |
| Cloudflare Pages | `public/_redirects` | `public/_headers` | not included |

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
production build in a browser: zero console violations, local fonts and Unsplash
photography still load. The one relaxation for scheduling is
`frame-src https://cal.com`, which is why the Cal.com embed is an iframe rather
than a script.

> **If you set `VITE_API_BASE_URL` to an origin other than the site's own, you
> must add it to `connect-src`** in `public/_headers` *and* `vercel.json`, or the
> browser will block every submission.

`VITE_*` variables are read at build time — a change requires a rebuild. The
server-side secrets (`RESEND_API_KEY` and friends) are read at runtime and belong
in the host's dashboard, not in a file. See
[Environment variables](#environment-variables) and `.env.example`.

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
- **`api/contact.js` must keep the `.js` extensions on its relative imports.**
  It runs on plain Node ESM, not through Vite, and Node will not resolve an
  extensionless specifier. Its imports are deliberately leaf modules
  (`validation.js`, `data/contact.js`, `data/serviceOptions.js`) so the function
  never pulls in the client's content graph.
- **The SPA rewrite on Vercel must keep its negative lookahead**
  (`/:path((?!api/).*)`). A plain catch-all would rewrite `POST /api/contact` to
  `index.html` and the function would silently never run.
- **The desktop header appears at `xl`, not `lg`.** Five nav links plus two
  calls to action need about 1155px of inner width, and `lg` offers ~932px. See
  `BREAKPOINT_XL` in `src/lib/motion.js` before moving it back.
- **The enquiry rate limiter is per-instance, not global.** It is a module-scope
  `Map`, which is honest for a small site and insufficient under a real attack.
  A shared store is the upgrade path; see [Enquiry email](#enquiry-email).
