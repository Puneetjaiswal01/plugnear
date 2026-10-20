# Web-first charging MVP · 20 October 2026

## Delivered scope

Find a compatible approved charger → request a one-hour pilot session → verified host accepts → driver opens fixed server-priced direct UPI checkout → driver reports the transfer reference → host checks their bank/UPI app and confirms actual receipt → host starts/finishes the physical charging session.

This is a manual direct-to-host payment pilot, not a bank-verified gateway integration. There is no escrow, automatic settlement, automatic refund, hardware relay control or measured-energy verification. No platform commission is collected by this flow. A QR or a driver screenshot is not proof of receipt. Requests retain exclusion constraints, server pricing, account checks and host verification.

## Backend applied

Only `yxisoddhwlzetrnfbbno` was changed. PostGIS 3.3.7 is installed in extensions; charger geography is generated from longitude/latitude with a GiST index. `get_nearby_chargers` validates coordinates/filter bounds, returns only RLS-visible approved verified-host listings and computes available/busy/offline status without exposing other drivers' bookings. The pilot searches the next hour; it is not a promise of future-slot availability.

Migrations `20261020092659_web_first_charging_mvp` and `20261020093245_mvp_checkout_hardening` were applied. Charger INSERT/UPDATE requires a verified owner via restrictive policies. Direct booking INSERT remains revoked: drivers use the guarded reservation RPC. Realtime publication contains chargers and bookings. Booking/window changes bump a non-sensitive charger revision so discovery refetches; subscriptions reconnect and a 15-second refresh handles missed events and time boundaries. The server always rechecks before reserving.

Private payout/ledger/event tables have RLS and no direct client grants. Checkout is limited to the booking's driver/host, snapshots the payee and amount, and refuses suspended/unverified hosts. Payment states distinguish unpaid, driver-reported and host-confirmed; none is represented as bank verification. A host cannot acknowledge the same transfer reference for two bookings. Charging is blocked until host receipt confirmation, and the charger row plus exclusion constraint protect competing sessions.

## PWA

The existing dedicated public Vercel project serves `/app/` with an install manifest, 192/512px icons and a versioned service worker. `app.plugnear.in` is attached to that project; the hostname's root redirects to `/app/`. The existing `/app/` on www remains a fallback.

Only public shell/code/style/icon assets are precached. API/auth calls, QR checkout records, GPS data, map tiles and POST requests are not cached or queued by the worker. Offline navigation displays a clear reconnection page. Online-only actions fail closed when disconnected. The manifest allows standalone installation; Android browser install prompts and iPhone Safari Add to Home Screen guidance are provided. Browser viewport/offline tests are not physical-device Safari/App Store validation.

## Verification

- 41 unit/domain/database/input tests passed, including the manual ledger, duplicate-reference rejection and exact paise URI construction.
- 44 browser tests passed across desktop/mobile, including driver request→QR→payment report, host acknowledgement checkbox→start→finish, and installed service-worker offline navigation.
- Browser backend/Realtime traffic is mocked and denied by default; these tests did not send money or SMS.
- Live rollback-only PostgreSQL smoke passed PostGIS search, available/busy propagation, reservation, checkout amount, driver report, host receipt and session lifecycle. All fixture records were rolled back.
- Live structural queries confirmed PostGIS/index, publication tables, restrictive host policy, no anonymous checkout, no direct booking insert, no direct private-payment reads and the confirmed-reference unique index.
- No real bank transfer, approved pilot charger, verified host or real phone OTP has been tested.

## Owner-dependent launch gates

1. **DNS:** Hostinger CNAME `app` → `f1c618b5cccdf237.vercel-dns-017.com`. Vercel domain ownership is verified, but the latest DNS check finds no app CNAME/A record. Do not alter @, www or admin.
2. **Phone OTP:** owner confirms no SMS provider. Supabase phone login remains disabled; email is the pilot fallback. Provision a supported SMS provider, necessary Indian sender/template setup and abuse/spend controls before enabling it. Never auto-confirm phone numbers or use test OTPs as production login.
3. **Pilot host:** live inventory and verified-host counts are zero. Register/verify a real host and their site, review/approve a real charger, configure their own VPA and open availability before inviting drivers. No fake inventory/VPA was seeded.
4. **Auth URLs/SMTP:** allow explicit redirects for `https://app.plugnear.in/app/` (and host intent), www app paths and native callback; verify real email delivery and recovery. Public APIs do not expose management credentials to configure these here.
5. **Live pilot:** verify real-device GPS, QR/UPI handoff, host reconciliation, actual charging and refund/dispute handling with consent. A manual status is not payment verification. Current support/privacy/terms describe the manual pilot; obtain review of the real operating terms before broad paid rollout.
6. **Security:** leaked-password protection remains disabled. Native toolchain audit findings remain unresolved; signed Android/iOS builds and store approvals are separate work.

## Deferred

Fleet/billing features, enhanced future-slot scheduling, physical QR standee/sticker generation and crowd-sourced broken-socket reporting are outside this sprint. Existing availability guards remain to prevent unsafe/double reservations; advanced scheduling stays out of the main driver flow. Account/support/privacy controls remain because they are needed for a usable pilot.

## Deployment-specific offline fix

Production verification found that Vercel clean-URL redirects make the precached offline response carry a redirected URL. The service worker now reconstructs a fresh Response for offline navigation. The Playwright static server emulates clean-HTML redirects so this behaviour is exercised locally. Public privacy disclosure includes OpenStreetMap tile-request metadata.

## Actual deployment results

Production deployment `dpl_3Qi5qjg1rwC9xhSbkBVqS7UZeje4` is READY, source `32ef83f2359c797c53b32235b62a94a5285b3cf4`. The existing fallback https://www.plugnear.in/app/ is verified live. app.plugnear.in is assigned but its DNS remains misconfigured pending the owner CNAME change; assignment/READY is not proof that the hostname works.

Live Chromium checks at 390 and 1440px passed HTTP 200, manifest/icons, active v2 worker, offline navigation, no horizontal overflow or JavaScript page errors, no API/map-tile caches, and phone OTP disabled as configured. Initial production testing found the clean-URL offline response issue; it was fixed and the real deployment retested successfully. Fourteen targeted browser tests passed against the redirect-emulating local server in addition to the previous complete 44-test pass. CI passed for the MVP source and the follow-up fix: https://github.com/Puneetjaiswal01/plugnear/actions/runs/39403007980 .
