# Content Review — Afghan Futian Trading Company

Prepared for owner/native review before publication. This document records what was reviewed, what was changed, what evidence supports each statement, what was removed, and what still needs confirmation. It does not change design, routing, animations, photography, Cal.com/Resend configuration or legal positions.

## 1. Scope and method

Reviewed:

- Every route and shared surface: Home, About, Global Sourcing, Supply Chain, Logistics, Global Network, Contact, Schedule, Privacy, Terms, 404, navbar, footer, mobile menu, preloader, hero, process, CTAs, forms, validation, loading/success/error states and transactional email.
- All content-bearing modules under `src/data/`, hardcoded page/component copy, `src/i18n/locales/{en,ps,fa-AF}`, `api/contact.js`, `server/lib/schedulingEmail.js`, `src/lib/errorCodes.js`, `src/lib/validation.js`, `index.html` and `I18N.md`.
- Company-controlled public sources for **this exact company only**: `https://afghanfutian.com`, `https://www.facebook.com/share/19mRWeAZsQ/`, `https://www.instagram.com/afghanfutian/`, `https://www.tiktok.com/@afghan.futian.trading.co`.
- Repository code and configuration as evidence of what the site actually does (third-party requests, form fields, booking flow, timezone, absence of cookies/analytics, placeholder imagery).

English source strings are i18next keys, so every source rewrite was synchronized across all three dictionaries. Key/order/placeholder parity is enforced by `src/i18n/dictionaries.test.js`. Terminology decisions are centralized in `CONTENT-GLOSSARY.md`.

### Evidence tiers

| Tier | Meaning | Used for |
| --- | --- | --- |
| **A — Company-controlled / code-verifiable** | Published on the official site/profile, supplied in the project brief, or directly verifiable in this repository | Identity, email, phones, three listed locations, service scope, Cal.com Kabul default, form fields, no-analytics statements, illustrative imagery |
| **B — Third-party/index metadata** | Public metadata or profile snippets not fully readable | Partial Facebook profile/share metadata, platform profile handles |
| **C — Unverified / ambiguous self-claim** | Appears in social copy or implies a fact without corroboration | “Licensed”, founder/“4 years”, gemstone cooperation, specific destination marketing, FOTEN/ZAM references, implied owned facilities or completed shipments |

Only Tier A was used for factual copy. Tier B was not used to add claims. Tier C was removed or left unpublished pending owner evidence.

## 2. Verified facts used

- Legal name: **Afghan Futian Trading Company**; brand: **Afghan Futian**.
- Website: `https://afghanfutian.com`; email: `contact@afghanfutian.com`.
- Phones: `+86 147 5788 1420`, `+93 70 513 2426`.
- Listed locations: **Yiwu, Zhejiang Province, China**; **3rd Floor, Noor Plaza, Street 2, Qala-e-Fathullah, Kabul, Afghanistan**; **Sader Market, Mandawi, Kabul, Afghanistan**.
- Official social links are the three URLs listed in section 1.
- The site currently serves photography from Unsplash; the images are illustrative placeholders, not records of company premises, vessels, aircraft, warehouses or fleets.
- Cal.com is used through its official booker, with `cal.tz=Asia/Kabul` (`GMT+04:30`); Cal.com supports Arabic but not Pashto/Afghan Dari interface locale, so the embed interface is unchanged.
- The site sets no analytics/tracking cookies and loads no external fonts; those are code facts, not promises about future conduct.

Research found no independent news, registry, customs or licence record for the company. The `afghanfutian.com` WHOIS creation date (`2026-11-16`) is technical domain data and was **not** treated as a founding date.

## 3. Claims and phrasing removed

| Removed / weakened | Replacement | Reason |
| --- | --- | --- |
| “international sourcing, trading and supply chain company connecting China with buyers and business opportunities worldwide” | “links buyers with Chinese suppliers and coordinates sourcing, trade documents and cargo movement; listed locations are in Yiwu, Kabul and Mandawi” | “Opportunities worldwide” is vague and implies reach not published. |
| “Global sourcing and supply chain solutions, connecting China with opportunities worldwide.” | “sources products in China and coordinates trade, documents and cargo movement for buyers in Afghanistan and other agreed markets.” | Names the work; removes “solutions/opportunities” filler. |
| “Global Sourcing” as a service title | “Product sourcing” | More precise for Yiwu wholesale purchasing; kept route URL unchanged. |
| “International Trade” as a service title | “Trade coordination” | Describes the work without implying import/export licences or volumes. |
| “International Sourcing & Logistics” / “Global Sourcing & Logistics” | “China–Afghanistan Sourcing & Trade” / “Sourcing & Trade” | Replaces generic global language with the published trade corridor. |
| Hero “The World Moves. / We Connect It” | “From Yiwu. / To Your Market” | Uses the published base and the buyer's destination instead of grand claims. |
| “Confirmed origin”, “Origin”, “Routes”, “Mode”, “Prefer to write” | “Published base”, “Sourcing base”, “Coordination”, “Service”, “Write to us” | Removes unsupported certainty and stiff UI vocabulary. |
| “Factory audits, laboratory testing and certification are not advertised… because none has been confirmed” | “Factory audits, laboratory testing and certification are not advertised as Afghan Futian services.” | States the boundary once, without meta-commentary about internal confirmation. |
| “Placeholder: …” image alt text | “Illustrative photograph: …” | Honest about imagery without using “placeholder” as visible UI vocabulary; code property name restored to `isPlaceholder`. |
| Vague form errors (“That does not look like…”, “Please use digits…”) | Short action-led errors (“Check the email address and try again.”, “Use digits only, with the country code if possible.”) | Clearer in all three languages; same validation rules. |
| Any “licensed”, founder, years-of-experience, customer/shipment/volume, warehouse/fleet, certification, partner, award, testimonial, route, port or revenue claim | Omitted | No supporting evidence supplied; not published. |
| Stock photography used as implicit proof of facilities | Visible illustrative-photography notes and legal wording | Prevents images from being read as company assets. |

No founding date, years of operation, export volume, country count, staff count, office classification, certification, licence, guarantee, testimonial, award or revenue figure was introduced anywhere.

A final claim/phrase audit also removed the last “international sourcing” wording from the OG image alt, replaced the stale `GLOBAL SOURCING` section comment with `PRODUCT SOURCING`, changed the About meta from “Markets served / Afghanistan & international” to “Buyers / Afghanistan & other markets”, changed “confirm a practical route” to “agree the next step”, and replaced the “Partnership / repeat working relationships” value with a method-only “Continuity / same point of contact and working method” statement.

## 4. Page-by-page review

| Page / surface | Weak original content | Replacement | Support | Removed / still unconfirmed |
| --- | --- | --- | --- | --- |
| **Home** | “Global sourcing and supply chain solutions, connecting China with opportunities worldwide”; generic capability list; stock images implied operations. | “Yiwu sourcing, coordinated through to delivery.” Introduction lead, four-stage capability framing, five-step process and four working commitments. Hero now reads “From Yiwu. / To Your Market”. Illustration notes added. | Tier A company data, route registry, media registry, code-verifiable process. | No offices, volumes, clients, routes or owned assets. Native review: Pashto hero line width, Dari ZWNJ in long headings. |
| **About** | “international sourcing, trading and supply chain company… elsewhere in the world”; “Team” invited assumed profiles. | “From supplier to destination.” One coordinated workflow: sourcing → coordination → movement. Explicit service boundaries: no unverified figures, partner-operated carriage, no inspection claim, per-enquiry destinations. Team section says profiles will be published only when confirmed. | Tier A identity/contact/locations; public service scope; no team data supplied. | Founder, team names, licence, years of operation and facilities remain unpublished. |
| **Global Sourcing** | “Global Sourcing” headline and catalogue-like tone; no brief structure; vague inspection implication. | “Sourcing from Yiwu.” Four decisions: define requirement, identify suppliers in China, compare on substance, confirm a direction. Six-detail brief checklist. Boundaries: individual handling, no inspection promise, prices follow the brief. | Tier A Yiwu location; method description only. | No supplier names, catalogue, audit/testing service, fixed price or sample guarantee. |
| **Supply Chain** | Generic “seamless” coordination language; implied control of outside events. | “One thread to export.” Production timelines, order details, documentation and handover kept aligned; one accountable contact. Responsibilities section states dates are tracked, not guaranteed, and partner facilities are arranged where needed. | Method description; Tier A contact/channel facts. | No guaranteed lead times, owned facilities or control over carrier/supplier events. |
| **Logistics** | “Logistics & Transportation” implied owned transport; fixed-route implication. | “Cargo, planned to the destination.” Four linked decisions: destination, mode selection with partners, export formalities, tracking. Explicit “Afghan Futian does not operate carriers or warehouses”; routes/rates confirmed per shipment. | Tier A service boundary; Cal.com/company config unchanged. | No owned vessels, aircraft, warehouses, fleets, named lanes, ports or volumes. |
| **Global Network** | “Global network” invited invented offices, lanes and volumes. | “From Yiwu outward.” Structure only: sourcing base, one coordination point, destinations agreed per buyer. Diagram ledger: “a structure, not a route map”; named routes require confirmed data. | Tier A published locations; no route evidence found. | No market count, country list, port, corridor or shipment volume published. |
| **Contact** | Vague “General Enquiry”; no guidance on what to send; no privacy framing; failure-path `mailto:` subject and footer were English-only. | Specific service options and field hints. Message asks for product, quantity, target price, delivery location and timeline. Success/error copy says plainly what happened; data note says details are used only to answer the enquiry, not added to a mailing list. The `mailto:` fallback now uses the active locale and the localized service label. | Tier A email/phones/locations; actual form fields in `src/data/contact.js`; code-verifiable no-mailing-list statement. | No response-time promise, sales funnel, CRM or marketing use. |
| **Schedule** | Generic meeting copy; risk of implying a company-owned scheduler. | “Book a sourcing call.” Surrounding copy describes the official Cal.com workflow, Kabul default and provider-sent confirmation; unconfigured state is honest. | `src/data/scheduling.js`, Cal.com embed code, `Asia/Kabul` / `GMT+04:30`. | Cal.com interface locale unchanged (no Pashto/Dari support); no rescheduling policy invented; no real bookings made during QA. |
| **Privacy / Terms** | Already honest drafts; risk of accidental legal changes during rewrite. | Wording reviewed for consistency with actual code and placeholder-imagery language. Substantive legal position, draft banner and “not in force” status unchanged. | Code-verifiable statements in this repository. | Qualified legal review still required; governing law, retention periods and registered entity remain undecided. |
| **404 / nav / footer / preloader** | Stale “Global Sourcing” labels and self-referential tagline translations. | Route registry unchanged; service labels now “Product sourcing” / “Trade coordination”. Approved taglines and nav labels preserved exactly. Preloader copy now “Sourcing & Trade”. | `src/data/navigation.js`, `src/data/company.js`. | Approved Pashto tagline corrected to `نړۍ خوځو.` with the approved line break; no wording drift in selector. |
| **Transactional email** | “Thank you for getting in touch…”; “A new enquiry was submitted on…”; “For your records, this is what you sent”. | “Thank you for contacting Afghan Futian. We have your requirement and will reply to this email address.”; “A new enquiry was submitted through afghanfutian.com.”; “For your records, here is what you sent”. | `api/contact.js`, `src/i18n/serverCopy.js`, existing email dictionaries. | No delivery-time promise; no marketing content; Resend config and provider IDs untouched. |
| **SEO / metadata** | “Global sourcing… opportunities worldwide” in `<title>`, description, OG/Twitter and JSON-LD `knowsAbout`. | Natural China–Afghanistan trade, Yiwu sourcing, import/export, cargo coordination and wholesale-purchasing language; JSON-LD `knowsAbout` lists only actual services. | Tier A identity and service scope. | Canonical URLs, hreflang, sitemap structure and route prefixes unchanged. |

## 5. Pashto and Afghan Dari work

- Rewrote the changed English keys into Afghan Pashto and Afghan Dari, not literal English calques. Every dictionary value was reviewed against the new English key.
- Audited every source string against the dictionaries and removed stale keys (old headings, route numbers, image ids, replaced validation copy), then added the 24 keys that were still hardcoded in components. The diagram label “Worldwide” was replaced with “Agreed separately” so no global reach is implied. The 686 active keys now have identical key sets and order in all three locales.
- Preserved exactly: English `Connecting Markets. Moving the World.`; Pashto `بازارونه سره نښلوو.\nنړۍ خوځو.`; Dari `بازارها را به هم پیوند میدهیم.\nجهان را به حرکت درمیآوریم.` (the `\n` shown here is the JSON escape for the required line break, not two printable characters); Pashto `زموږ په اړه`; Dari `درباره ما`; selector `Eng | پښتو | دری`; Dari `حمل و نقل`.
- Corrected the Pashto hero keys from the old “world moves / we connect” translation to “له ییوو څخه.” / “ستاسو بازار ته”; Dari to “از ییوو.” / “به بازار شما”.
- Replaced non-native or ambiguous prior forms listed in `CONTENT-GLOSSARY.md` (`بازارگاه`, `تلرانس`, `جهت هنری`, `آزادسازی`, `تحویل و تحول`, Pashto `مقر`/`شتمنۍ` where they implied owned assets).
- Standardized brand short forms to `افغان فوټیان` (Pashto) and `افغان فوتین` (Dari) and documented them as pending owner confirmation.
- Fixed Dari joined words (`حملونقل` → `حمل و نقل`, `منډویاند` → `منډوی هستند`) and restored the glossary CTA forms in metadata titles.
- Standardized Pashto orthography (`نیټه` → `نېټه`, `رپوټ` → `راپور`, `کیدای` → `کېدای`) and common Dari word spacing in legal copy.
- Kept Cal.com's own interface in its supported default; surrounding page copy is localized.

### Items requiring native confirmation

1. Pashto `د توکو لېږد` / `د بار لېږد` versus `لوژستیک`; check long animated heading line breaks and clipping.
2. Dari ZWNJ placement in `تأمین\u200Cکننده`, `بسته\u200Cبندی`, `اداره\u200Cمیشود`, `اعلان\u200Cشده`; also check `لازمالاجرا` and legal-term spacing.
3. Pashto/Dari brand transliteration and whether the full legal name should remain Latin in formal metadata. Legal copy now uses the Dari short form while keeping the English legal name where it is the registered name.
4. RTL spacing, punctuation and word joining in form messages, email templates and the LTR preloader island.
5. Dari `رهایی` for customs “release”, Latin acronyms `CRM`/`IP` in legal drafts, and whether `Unsplash` should be transliterated consistently in both languages.
6. Legal drafts need qualified legal review in addition to language review.

## 6. Owner decisions still open

- Confirm the company identity facts and any real metrics the owner wants published. Nothing has been added without evidence.
- Confirm whether “licensed”, founder/“4 years”, gemstone cooperation, FOTEN/ZAM references and specific destination marketing are accurate; they remain unpublished.
- Confirm final brand photography. Current imagery remains illustrative and is labelled as such.
- **FAQ:** a rewrite was requested, but no FAQ route or FAQ content exists in `src`. Decide whether to add a new FAQ page/content (and its three locales, metadata and sitemap entry) or record it as out of scope. No FAQ copy was invented.

## 7. Out-of-scope safeguards

Unchanged by this content pass: design system, colors, logo, photography, GSAP/ScrollTrigger/preloader timing, Lenis, layouts, responsive behavior, React Router routes, canonical/hreflang/sitemap structure, Cal.com URL/iframe/origins/timezone, Resend configuration, honeypot/rate-limit/dedupe logic, and legal draft status.

## 8. Pre-publication verification

- `npm run check` passes: lint clean, **184/184 tests**, production build succeeds.
- Dictionary audit: **686 active keys per locale**, with identical key sets/order and matching placeholders; no missing or stale source keys.
- Browser sweep: all ten routes plus the 404 were checked in English, Pashto and Dari at desktop width. Each had the correct `lang`/`dir`, localized title and `h1`, no console errors, no document-level horizontal overflow, and a preloader that hands off to the page.
- Animated headings: scroll-trigger sweeps across Home, About, service pages, Contact and Schedule in all three locales found **0 clipped `.line-inner-mask` instances**.
- Mobile-width check: all routes/locales were rendered in a 390px iframe. No document horizontal overflow and no clipped animated headings were found. Intentional image-parallax overscan and the off-screen honeypot were excluded.
- Form QA: empty validation, `submitting`, success and failure states were exercised in all three locales with a stubbed API. No real enquiry was sent. The failure-state `mailto:` fallback uses the active locale, localized service label and localized footer.
- Metadata QA: canonical URL, hreflang set, Open Graph locale/title/image and JSON-LD `Organization` type were checked on `/about` in all three locales.
- Schedule QA: the localized fallback and `GMT+04:30` note were checked; Cal.com was not driven and no booking was made.
