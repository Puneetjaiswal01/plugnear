# Full-launch audit · 21 October 2026

## Current scope

Web/PWA first, with email accounts and direct host UPI/manual receipt confirmation. No payment gateway, Play/App Store release or independent metering is being represented as complete. Keep the public site labelled as a pilot until real inventory and the supervised live acceptance test exist.

## Findings and fixes

- Live invalid-token `/auth/v1/verify` probes returned HTTP 303 to `https://app.plugnear.in/app/` both with the default destination and an explicit app redirect. No real token was used and no verification was bypassed. This resolves the observed localhost destination, but old links and cross-browser PKCE flows still need users to request a fresh link/return to sign-in. The management config was not changed from this environment.
- Added neutral signup-confirmation resend, a per-email client cooldown and clear instructions to return to sign-in. The server remains responsible for rate limits/abuse controls. Unavailable phone/social providers stay disabled; email ownership is never auto-confirmed.
- Auth errors clear after a successful session. Updated support instructions cover old links, confirmation, password recovery and keeping credentials/confirmation links private.
- Rechecked the owner-selected admin email privately: no matching Auth user exists, and there are 0 administrators, 0 chargers and 0 verified hosts. No account or role was fabricated. The owner must choose a password privately during registration and confirm ownership before the exact account can be promoted.
- Live rollback-only database smoke passed spatial discovery, availability/busy, reservation, server-priced UPI checkout, driver report, rejected driver receipt confirmation, host receipt and charge completion. No test records remained and no transfer was sent.

## Required before a broad paid launch

1. Register/confirm the owner-selected admin account; grant only its verified UUID via a trusted operator, with an audit record. Verify ordinary members remain denied.
2. Owner confirmed no custom email provider. Resend domain verification and SMTP setup are now the chosen path; follow TRANSACTIONAL_EMAIL.md. Configure/verify real transactional email delivery, including confirmation, recovery and expired-link handling on independent user addresses. The environment exposes no Auth-management credential or SMTP provider setup. Do not paste secrets into chat or client env files.
3. Onboard one genuine host and review site/equipment/permission evidence, approve their charger, configure the host's own VPA and publish availability. No invented inventory, addresses, verification evidence or testimonials.
4. Run a supervised real-device GPS/directions/request/accept/UPI receipt/start/finish test, including pending transfer, cancellation and dispute/refund handling. A database rollback smoke and mocked browser flow do not replace this test.
5. Review operational support, real pilot terms and privacy/retention/legal obligations. Direct host UPI does not include automated refunds, bank verification, platform custody or guaranteed delivered energy.
6. Review the unresolved dependency audit and Auth security configuration before broad rollout. Audit remains 16 high / 7 moderate, no critical. Root advisory packages include node-forge (latest registry 1.4.0) and braces (latest 3.0.3), with no compatible published fixes seen. Both occur in Expo build/development dependencies; the deployment serves static artifacts and does not expose Metro/Expo development servers. This narrows exposure, not proof of safety. Do not force unsupported Expo 44/RN 0.72 downgrades to silence npm audit.

## Deferred or provider-dependent

Phone OTP requires a supported SMS provider and applicable India sender/template setup; Google/Apple require their provider credentials. Email is the interim path. Native/TWA signed builds and stores, gateway payments, advanced scheduling, printed QR kits, broken-socket reporting, Hindi and stored waitlist remain separate work. Search Console ownership/indexing is still owner-dependent and Google controls search/AI placement. Claim360 resources are outside this work.

## Confirmation recovery release

Source `69dafaf` is deployed to production as `dpl_84Q1NnWug5dAEkYT6Xtyjf39PdT2` (READY). HTTPS checks on app HTML, its exact JavaScript artifact and support page returned 200 and matched local SHA-1 digests. GitHub CI run 39552240985 passed. Local validation before deployment: typecheck, 44 unit tests and 56 browser tests passed. Live email delivery is still untested until the owner configures the provider; no SMTP key or DNS value was fabricated.

## Homepage journey update

Source `9f5212a` deployed as `dpl_AbPpbQnqAG4QiARPTfzqSzMrMrHk` (READY). Homepage now explains find → request/accept → direct UPI/manual receipt confirmation → charge, with a practical host review/availability/cost guide. Brand, public contacts, Delhi NCR recruitment status and fleet route remain. Co Charger was supplied as a reference; its homepage returned HTTP 403, so no claim is made to a visual audit or reproduced assets.

Static website build and all 12 existing homepage browser checks passed across mobile and desktop. Live browser checks at 390px and 1440px confirmed the new content, no horizontal overflow and no script errors. This is a public website update, not proof of live email delivery or a real charging/payment session.

## Reference-led visual update — 23 October 2026

Source `c8fbde1` deployed as `dpl_37fdpYH1Yh8S4NA6PXNEY9n5Abzq` (READY). Original SVG/CSS charging artwork replaces the illustrative hero photos; rounded navigation, large blue typography, dark audience cards and restrained entrance motion give the homepage a more futuristic visual direction. Public contacts, driver/host routes, fleet offering and pilot/payment limitations remain. The homepage-only stylesheet does not restyle the app/admin/legal pages.

Reviewed the user-supplied websites through text browsing; browser screenshots were captured for Plaid, NAKA, WorldQuant Foundry, Acorns and Cerebrium. The Foundry capture remained on its loading screen, and Nullmask exposed no substantive text. No claim is made to fully inspect every frame, interaction or design. No third-party branding, code, artwork, customer logos or commercial claims were copied.

Static build and 12 homepage browser checks passed. Live HTTPS browser checks at 320/390/768/1440px passed with no horizontal overflow or script errors, and reduced-motion settings disabled the entrance animation. Live mobile menu/host anchor and app sign-in reachability passed. GitHub source pushed; CI run 39919504287 was still running at this check. This is a visual release; SMTP/confirmed admin, genuine inventory and a physical charging/payment acceptance test remain launch prerequisites.
