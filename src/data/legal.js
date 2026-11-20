import { CONTACT_DETAILS } from './navigation'

/**
 * LEGAL DOCUMENTS — PRIVACY NOTICE & TERMS OF USE
 * ============================================================================
 * ⚠️  Both documents below are DRAFTS. They are marked as drafts in the UI, and
 * that marking must not be removed until a qualified lawyer has reviewed them
 * against the law of the jurisdiction Afghan Futian is established in.
 *
 * Why they exist at all, if they are drafts
 * ----------------------------------------------------------------------------
 * A contact form that collects a name, an email address and a message is
 * collecting personal data. Publishing nothing at all is not the neutral option
 * it looks like — it simply leaves the visitor with no statement of what
 * happens to what they send. So the site ships an honest draft, labelled as
 * one, rather than silence or a generic template copied from elsewhere.
 *
 * The copy rules are the same as every other page
 * ----------------------------------------------------------------------------
 *  • Every statement here is checkable against the code in this repository.
 *    The form fields are read from `contact.js`; the third-party requests are
 *    the Unsplash CDN loads the site actually makes; the
 *    absence of cookies, analytics and tracking is a fact about this codebase,
 *    not a promise about future conduct.
 *  • Where a decision has not been made — a retention period, a governing law,
 *    a registered entity — the document says it has not been made. A placeholder
 *    is written as a placeholder. Nothing is invented to fill a gap.
 *  • Nothing here offers legal advice, and nothing here should be read as a
 *    substitute for the reviewed version.
 */

/**
 * The draft banner, rendered once at the top of both documents. Kept as one
 * object so the wording can never drift between the two pages.
 */
export const LEGAL_DRAFT = {
  eyebrow: 'Draft — not in force',
  title: 'This document has not been reviewed by a lawyer.',
  body: 'It is a working draft written from what this website actually does. It is not legal advice, it is not yet binding, and it must be reviewed against the law of the jurisdiction Afghan Futian is registered in before it is published. Do not rely on it as it stands.',
}

export const PRIVACY = {
  index: '01',
  label: 'Legal',
  title: 'Privacy Notice',
  intro:
    'What happens to information when you use this website — the contact form, the meeting booker, and the third-party requests a page makes as it loads.',
  meta: [
    { label: 'Status', value: 'Draft' },
    { label: 'Applies to', value: 'This website' },
    { label: 'Last reviewed', value: 'Not yet' },
  ],
  sections: [
    {
      id: 'privacy-scope',
      index: '01',
      heading: 'What this notice covers',
      paragraphs: [
        'This notice explains what happens to information when you use this website. It covers the contact form on the Contact page, the meeting booker on the Schedule page, and the small number of third-party requests the site makes whenever a page loads.',
        'It is written from what the site actually does. Where a decision has not been made yet — how long an enquiry or booking is kept, for example — it says so, rather than stating a policy that does not exist.',
      ],
    },
    {
      id: 'privacy-collect',
      index: '02',
      heading: 'What the contact form collects',
      paragraphs: [
        'The contact form asks for your name, your company (optional), your email address, your telephone number (optional), your country (optional), the service you are enquiring about, and your message. Nothing else is required to send it.',
        'The form also contains one field that a person never fills in and never sees. It exists only to catch automated submissions: if it has been filled, the enquiry is discarded and nothing is stored.',
      ],
    },
    {
      id: 'privacy-purpose',
      index: '03',
      heading: 'Why we use it',
      paragraphs: [
        'We use the details you send for one purpose: to read your enquiry and reply to it. The email address you give is the address we answer at.',
        'We do not use your details to send you marketing, to build a profile of you, or for any purpose you have not asked us to.',
      ],
    },
    {
      id: 'privacy-not',
      index: '04',
      heading: 'What we do not do',
      items: [
        {
          label: 'No cookies for tracking',
          body: 'The site sets no cookies of its own, and no advertising or analytics cookies.',
        },
        {
          label: 'No analytics or tracking',
          body: 'No analytics service, session recorder, heatmap or advertising pixel is loaded anywhere on this site.',
        },
        {
          label: 'No mailing list',
          body: 'Enquiries are answered individually. Details are not added to a newsletter, a mailing list or a CRM for marketing.',
        },
        {
          label: 'Not sold or shared',
          body: 'Your details are not sold, rented or traded, and they are not passed to a third party for that party’s own use.',
        },
      ],
    },
    {
      id: 'privacy-third-parties',
      index: '05',
      heading: 'Third-party requests the site makes',
      paragraphs: [
        'The site serves its typefaces from this website, and its placeholder photography from the Unsplash image CDN. When a page loads, your browser requests the photography directly from Unsplash, which means your IP address and basic browser details are visible to that provider.',
        'This happens on every visit, whether or not you use a form. It is a consequence of how the site is currently built, and it is stated here rather than left unmentioned.',
        'The meeting booker does not load Cal.com code in your browser and does not embed its calendar. Your browser calls this website only; the server then calls Cal.com and Resend. Those providers receive the details needed to make the booking and send its mail, under their own privacy terms.',
        'The company that hosts this website also keeps standard server logs — such as IP address and requested page — as part of running the server. The host and its retention period have not been chosen yet.',
      ],
    },
    {
      id: 'privacy-retention',
      index: '06',
      heading: 'How long enquiries are kept',
      paragraphs: [
        'A retention period has not been set yet for enquiries, and we have not yet confirmed the retention settings of the Cal.com account that stores bookings. Until both are decided, treat this as undecided rather than as a promise. This notice will be updated to state the periods before the site is published.',
      ],
    },
    {
      id: 'privacy-bookings',
      index: '07',
      heading: 'What the meeting booker collects',
      paragraphs: [
        'To reserve a meeting, the booker asks for your name, email address, company and phone number (both optional after the first two), the purpose of the meeting, and your timezone. It also records the date and time you choose.',
        'That information is sent to this website’s own server, which passes the booking details to Cal.com so the meeting exists on the company calendar, and to Resend so the confirmation, notification and any reminder can be delivered. The private credentials for those services are never sent to your browser.',
        'The confirmation screen shows a signed link that lets you reschedule or cancel that one booking without signing in, and our branded emails include the same link when they are enabled. Otherwise our scheduling provider’s confirmation carries its own management links. Our link is tied to both the booking and the email address it was issued for; changing either makes it invalid.',
      ],
    },
    {
      id: 'privacy-rights',
      index: '08',
      heading: 'Your rights',
      paragraphs: [
        'What you are entitled to ask us to do with your information depends on where you live; different jurisdictions grant different rights. We have not yet confirmed which regime applies to Afghan Futian.',
        'In the meantime, if you want an enquiry deleted, or a copy of what you sent, write to us at the address below and we will act on it.',
      ],
    },
  ],
  contact: {
    label: 'How to contact us about privacy',
    body: 'Privacy questions and requests go to the same address as everything else: contact@afghanfutian.com. Afghan Futian Trading Company publishes its official telephone numbers and office locations on the Contact page.',
  },
}

export const TERMS = {
  index: '02',
  label: 'Legal',
  title: 'Terms of Use',
  intro:
    'The terms on which this website is provided, and what its content does and does not represent.',
  meta: [
    { label: 'Status', value: 'Draft' },
    { label: 'Applies to', value: 'This website' },
    { label: 'Last reviewed', value: 'Not yet' },
  ],
  sections: [
    {
      id: 'terms-about',
      index: '01',
      heading: 'About these terms',
      paragraphs: [
        'These terms govern your use of this website. By using the site you accept them; if you do not accept them, please do not use the site.',
        'They are a draft and are not yet in force. See the notice at the top of this page.',
      ],
    },
    {
      id: 'terms-not-an-offer',
      index: '02',
      heading: 'This site is information, not an offer',
      paragraphs: [
        'Everything on this website is general information about the way Afghan Futian works. Nothing on it is an offer, a quotation, or a promise to supply, and nothing on it creates a contract.',
        'Any actual engagement — sourcing, coordination or the movement of goods — is agreed separately, in writing, on terms specific to that requirement.',
      ],
    },
    {
      id: 'terms-illustrative',
      index: '03',
      heading: 'Content is illustrative, and partly pending',
      paragraphs: [
        'Much of the content on this site describes method rather than confirmed fact. Where a figure, certification, market, route or owned asset would normally be stated and is not, it is because Afghan Futian has not confirmed it. The site says so on the page rather than filling the gap.',
        'The photography is illustrative placeholder imagery. It is not a record of Afghan Futian’s own operations, premises or assets, and it does not imply that the company owns any vessel, aircraft, warehouse or vehicle shown.',
      ],
    },
    {
      id: 'terms-contact',
      index: '04',
      heading: 'Contact details',
      paragraphs: [
        'The email address, telephone numbers and office locations shown on this site are the official contact details supplied by Afghan Futian Trading Company.',
        'Map links, where provided, open an address search rather than a guessed pin. No opening hours or office classifications are published because none has been supplied.',
      ],
    },
    {
      id: 'terms-ip',
      index: '05',
      heading: 'Intellectual property',
      paragraphs: [
        'The Afghan Futian name and any logo are the property of the company, and the written content of this site belongs to Afghan Futian.',
        'The photographs are placeholders sourced from Unsplash and used under that service’s licence. They are not owned by Afghan Futian, and they will be replaced with licensed brand photography.',
      ],
    },
    {
      id: 'terms-links',
      index: '06',
      heading: 'Links to other sites',
      paragraphs: [
        'This site links to the official Facebook, Instagram and TikTok profiles of Afghan Futian Trading Company. External links open in a new tab.',
        'Afghan Futian is not responsible for the content or the practices of the sites those links lead to.',
      ],
    },
    {
      id: 'terms-liability',
      index: '07',
      heading: 'Limitation of liability',
      paragraphs: [
        'To the extent the law allows, Afghan Futian is not liable for any loss arising from your use of this website or from reliance on its content. Because the site is informational, it should not be relied on for any decision without written confirmation from the company.',
        'Nothing in these terms excludes any liability that cannot lawfully be excluded.',
      ],
    },
    {
      id: 'terms-law',
      index: '08',
      heading: 'Governing law',
      paragraphs: [
        'The jurisdiction whose law governs these terms has not been confirmed yet. It will be stated here, along with the courts that have jurisdiction, before the site is published.',
      ],
    },
    {
      id: 'terms-changes',
      index: '09',
      heading: 'Changes to these terms',
      paragraphs: [
        'These terms will change as the site and the company’s details are finalised. The version published on this page is always the current one.',
      ],
    },
  ],
  contact: {
    label: 'Questions about these terms',
    body: 'Questions about anything on this page, or about using the site, can be sent to the address below.',
  },
}

/** Shared footer for both documents: the address to write to. */
export const LEGAL_CONTACT = {
  email: CONTACT_DETAILS.email,
  emailHref: CONTACT_DETAILS.emailHref,
}

export default { LEGAL_DRAFT, PRIVACY, TERMS, LEGAL_CONTACT }
