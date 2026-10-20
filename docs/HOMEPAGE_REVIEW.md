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
