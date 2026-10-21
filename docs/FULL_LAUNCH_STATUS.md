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
