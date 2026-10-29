# Dubai preparation and launch gates

Prepared **29 October 2026**, using official public sources below. Dubai is a separate proposed market, not an extension of the India payment arrangement. No Dubai company, licence, merchant account, approved site or partnership was created by this work. No outreach was sent.

## What is prepared

- Public `/dubai/` partnership page for property/community managers, fleets, prospective hosts and licensed charging operators. It explicitly distinguishes enquiries from listings, reservations and payments.
- Dubai enquiry draft with consent and data-minimising fields. It opens the existing team's mail address; it is not a stored waitlist or a UAE support-office claim.
- Shared public country settings: IN / INR / Asia/Kolkata / India pilot; AE / AED / Asia/Dubai / partnership-only. Unsupported regions fail closed. Money formatting does not exchange currencies or make a tariff legal.
- Fleet planner region selection and exports label the country, currency context and time zone. Region changes invalidate prior exports. The energy model and presets remain illustrative, not vehicle specifications, site engineering or jurisdictional approval.
- Web app `?market=AE` shows a partnership route instead of authentication, charger listing, booking or UPI checkout. An unknown region does not default into the India booking screen. Default/native app flow remains the India pilot. No separate native Dubai store build is claimed.
- Dubai link added to website and app support, canonical/sitemap added, and privacy text explains the enquiry's international email processing.

The client market gate is **not** database authorization. Existing server reservations still use the India-era schema and INR/amount_paise semantics. No country discriminator, AED ledger, UAE payment gateway or database migration has been introduced. Do not approve UAE operational listings or turn on UAE sessions until the server-side gates below exist. The India pilot still needs its own operational launch acceptance.

## Regulatory research: what affects the business model

[DEWA's current framework](https://www.dewa.gov.ae/en/builder/useful-tools/regulatory-framework-for-ev-charging-infrastructure) states that independent operators of public EV charging infrastructure require a CPO licence, including free/paid service variants. Its current linked [regulation, version 1.3](https://www.dewa.gov.ae/-/media/Files/DRRG2025/EV_Charging-Infrastructure-regulation_EN_V1-3_20251127.ashx), distinguishes private household/organisation use from third-party use. It also regulates tariffs, invoice components and additional access/service charges. These points require model-specific advice; an existing home charger or a free zone must not be treated as an automatic exemption.

**Decision:** begin with a real property/fleet partner and a suitably licensed operator. Obtain written clarity on which party operates the equipment, who contracts with the driver and how PlugNear may be remunerated. Do not copy India's host-set rates, platform commissions or subscriptions into Dubai without review. Do not describe PlugNear as licensed, DEWA approved, insured or integrated with a network without evidence.

[Dubai DET's business-licensing overview](https://www.dubaidet.gov.ae/en/licences-and-permits/business-licensing) provides the official mainland starting point. A local adviser should confirm the correct activities, entity/partner arrangement, mainland/free-zone implications, tax/accounting and contractual responsibilities. This research is not a licence determination or legal clearance.

The official [UAE personal-data law page](https://uaelegislation.gov.ae/en/legislations/1972) returned access restrictions during this review; [the government data-protection overview](https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws) exposed no usable body. Therefore no claim is made to a completed legal/privacy audit. Have UAE counsel assess applicable federal/free-zone rules, email/marketing consent, cross-border transfers, processor contracts, security and retention before operational collection. The existing database is in Mumbai; neither moving it automatically nor assuming that is compliant is an acceptable shortcut.

## Required before enabling a Dubai booking

| Gate | Required evidence |
|---|---|
| Operating model | Entity/activity approvals; operator and site responsibilities; applicable DEWA licence/approvals; commercially permitted tariff and remuneration model |
| Real supply | Genuine permission, equipment documentation and local electrical/site review; approved access/parking arrangements; no copied third-party inventory |
| Payments | Suitable UAE merchant and marketplace eligibility; AED settlement, payment confirmation, reconciliation, VAT/invoices, refund/dispute and beneficiary arrangements |
| Data/terms | Reviewed UAE operational terms/privacy; cross-border processing decision; limited identity evidence and retention; no sensitive documents in email drafts |
| Languages/support | Human-reviewed English/Arabic operational copy, UAE-compatible contact numbers and reliable local support; no unprovisioned office/WhatsApp claim |
| Technical activation | Server market/currency rules, authorisation/concurrency tests and payment-provider verification; client settings alone cannot authorize it |
| Acceptance | Consented real-device Dubai GPS, booking, charging and payment/refund tests with the approved operator |

Provider selection must follow the actual UAE entity and business model. [Stripe's payment-method support guide](https://docs.stripe.com/payments/payment-methods/payment-method-support) explicitly ties availability to country, currency and integration; this is a candidate to assess, not an integration or merchant approval. Check other UAE-acquiring providers against the same requirements. Never insert merchant secrets into public configuration or simulate bank verification. Current INR/direct-host UPI is not a UAE AED checkout integration, even if some UAE merchants accept cross-border UPI through their own arrangements.

## Server design before activation

1. Add an authoritative market ID to chargers and immutable market/currency snapshots to bookings/ledger. Determine country from verified site evidence and controlled admin review, not an editable client claim or a rough geographic rectangle.
2. Replace India-specific amount assumptions through a reviewed migration: safe integer minor units plus ISO currency, validated consistency with each charger/checkout. Never relabel historical amount_paise as AED or silently convert it.
3. Keep stored timestamps UTC; use Asia/Kolkata or Asia/Dubai for display and local scheduling. Do not use the phone's country/time zone as booking authority.
4. Make server market activation explicit and initially disabled for AE. Enforce this on listing approval, discovery, reservation, checkout, charging and payment actions; test direct API calls independently of the UI.
5. Keep UPI exclusively on the supported INR path. UAE payment orders must be server-priced and verified through the chosen provider's signature/webhook/reconciliation flow with idempotency and refund handling.
6. Preserve owner/participant RLS and overlap constraints. Test cross-market/tenant access, mismatched currency, replay, blocked/unverified hosts, stale quotes and disabled-market calls. Do not add SECURITY DEFINER or public grants as a shortcut.
7. Review the scope/hosting/retention decision before storing UAE operational records. Any additional project/region or paid provider needs its own concrete provisioning decision; Claim360 remains out of scope.

## Proposed first partnership brief

Request only high-level operational facts at first: organisation/role, Dubai neighbourhood, vehicle group and numbers, approximate dwell windows, site/parking permission, existing equipment/connector/power, operator/licensing status and willingness to run a supervised pilot. Collect detailed documentation later through an approved private process. Ask DEWA/advisers how the proposed third-party arrangement and fee model are classified; do not send personal identity or financial documents in an unsolicited enquiry.

Start with one approved site/operator and a small consenting cohort. Expand only after recorded successful sessions and support/refund handling. No pilot date, charger count, investment return or customer agreement has been announced.

## Source and implementation limits

The public website and published DEWA regulation were reviewed; no regulator, lawyer, insurer or provider has approved PlugNear. The statutory portal access limitation is recorded above. The provided country settings and public enquiry path are preparation, not a live Dubai charging marketplace. Validation/deployment results are appended after checks complete.
