# Follow-up to launch review · 23 October 2026

The review includes useful launch gates and some items already delivered. Current release has email/password sign-in, an installable PWA, Delhi NCR recruitment messaging, compatibility guidance (not a model checker), a local host cost calculator, fleet planner and a structured request/UPI flow. Email form availability is not proof of transactional delivery; no SMS provider or Google OAuth configuration was created by this work.

## This follow-up

- Removed personal telephone links/numbers from homepage, structured contact data, support and discovery guide. Kept the existing functioning business enquiry email until a real domain mailbox/WhatsApp Business channel is provisioned. No `hello@` address was invented.
- Added `/find`, `/host`, `/fleet` and `/fleet-planner` aliases to the existing routes, plus app startup recovery and JavaScript-disabled public help. The app requires JavaScript and authentication; a text-only crawler cannot inspect it like a static page.
- Replaced vague discovery-screen heading with a direct charging search description. Zero matches now offer wider search, host switching and an enquiry route. Backend failure is a separate state and does not claim zero inventory.
- Retained one recruitment identity and the safety-critical payment/compatibility limitations. Did not claim a working pilot, site safety certification, insurance, refunds, verified hardware status or live nationwide coverage.
- Typecheck and Expo web/static build passed; all 68 Chromium desktop/mobile browser tests passed, including new route, no-JavaScript, startup failure, zero supply and service-error cases. A stale local preview process initially served the previous redirect handler; restarting that process and rerunning the complete suite passed.
- WebKit downloaded, but the runtime lacked required shared libraries; that test engine was not run. Browser viewport tests do not replace a real iPhone/Android acceptance test. See PHONE_PILOT_ACCEPTANCE.md.

## Owner/operational work still needed

Verify transactional SMTP and the registered administrator; onboard a genuine reviewed host and run physical charging/payment UAT. The proposed 20–30 hosts / 50–100 drivers are recruitment targets, not achieved inventory. Select a real society/RWA cluster within Delhi NCR before broader acquisition. Provider-backed stored waitlist, funnel analytics, Google/SMS, domain email/WhatsApp, gateway refunds, real photographs/reviews, reviewed legal/privacy/insurance arrangements and roaming remain on hold. Existing public enquiry is an email draft, not a stored waitlist.

The prior 20 October review below is historical; the preference then to retain phone numbers has been superseded by this review's request to remove them.

---

# Homepage review follow-up · 20 October 2026

## Ready changes

- Owner selected Delhi NCR for pilot host recruitment. Hero and search metadata name that area without claiming live charger coverage.
- Email login is already implemented and enabled; homepage FAQ/process now explain the fallback rather than implying SMS is required.
- Removed stale registration-prototype/unavailable-workflow copy and corrected the terms dialog to reflect the direct-UPI pilot. Retained compatibility, approval and manual-payment limitations.
- Consolidated future features into one Roadmap section. Kept illustrative visuals labelled and did not add fake hosts, testimonials or pilot numbers.
- Added local pilot enquiry draft for city, driver/host/fleet role and vehicle type, with required consent, explicit send instructions and a privacy update. This is not a database-backed waitlist, and nothing is transmitted until the visitor sends the draft through their own mail app.
- Added host pricing explanation with an illustrative gross calculation and explicit energy-metering/refund limitations; strengthened trust/support links and brief team/contact context.
- Owner requested keeping the existing Zoho address and public phones. No unprovisioned domain email or WhatsApp Business account is advertised.
- Fixed mobile announcement-link visibility and darkened low-contrast secondary text. Tested all homepage hash targets and form consent/draft behaviour on both viewport sizes.

## Kept on hold

Stored waitlist with delivery/abuse/retention controls; verified vehicle-model catalogue and compatibility checker; provisioned domain email and WhatsApp Business; real photos, approved inventory and genuine feedback; Hindi translation; consent-reviewed funnel analytics; standalone About/company details beyond confirmed team contacts; genuine city/charger pages and eligible business listings; native stores, payment gateway, independent metering and legal review. No invented address, incorporated company, guarantee, listing or testimonial was added.

Existing PWA remains available. Search Console verification/indexing and real host/device/payment launch gates remain as documented in LAUNCH_HANDOFF.md. FAQ schema is not treated as a ranking shortcut; Google restricts FAQ rich-result eligibility and no rich result is promised.

## Actual release results

Production deployment `dpl_CMPdDEq3eRVswnCjJmuy8xJGiFng` is READY, source `9c5b456`. www and app aliases are assigned. Live homepage browser checks passed at 390px and 1440px: HTTP 200, Delhi NCR hero, visible working announcement anchor, enquiry draft generation, no horizontal overflow or JavaScript page errors.

Twelve targeted desktop/mobile homepage browser tests passed, covering assets, app reachability, navigation, privacy, public canonical URLs, hash targets, required enquiry consent, correctly encoded city/role/vehicle email draft and no form-data submission. Lighthouse 13.5.0 mobile lab run on the local static build scored Performance 77, Best Practices 96 and SEO 100. After fixing its remaining contrast finding, an accessibility-only rerun scored 100 and passed the contrast audit. These are separate local lab runs, not production field Core Web Vitals or proof of complete accessibility; performance remains a follow-up opportunity. Browser and Lighthouse artifacts are in the execution workspace under `/tmp/plugnear-home-*` and `/tmp/plugnear-lighthouse-*`.

Source-release CI: https://github.com/Puneetjaiswal01/plugnear/actions/runs/39449432098 (check the actual run result; not assumed from local tests). No Supabase schema, authentication provider or Claim360 changes were made for this homepage release.
