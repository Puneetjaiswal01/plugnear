# PlugNear launch handoff · 20 October 2026

## Verified deployment

- Website: https://www.plugnear.in/ — HTTP 200.
- PWA: https://app.plugnear.in/ redirects to `/app/` — HTTP 200. Vercel reports verified and `misconfigured: false`; no further app DNS edit needed.
- Admin: https://admin.plugnear.in/ — HTTP 200, authentication gated. Served JS/CSS hashes match the current local production build.
- Public/PWA deployment: `dpl_5SB8hByv2LHz48pHAZj77DMJFcJu`, READY, source `68db7b2`. No redundant production redeployment was needed after test/documentation-only edits.
- GitHub push restored and search-release CI passed: https://github.com/Puneetjaiswal01/plugnear/actions/runs/39445058000 .
- TypeScript, 41 domain/database/input tests, 46 desktop/mobile browser tests, admin build and static website build passed locally. Browser workflow tests use mocked backend responses and database fixtures, not real money/SMS.
- Live browser checks at 390 and 1440px passed homepage/guide/admin layout, app HTTPS/sign-in rendering, manifest, active service worker and offline fallback. No Supabase/map-tile responses appeared in worker caches. This is Chromium viewport testing, not physical Safari/Android or actual GPS/payment testing.

## Confirmed launch gates

Read-only checks against **PlugNear only** (`yxisoddhwlzetrnfbbno`) found 0 chargers, 0 bookings, 0 verified hosts, 0 administrators, and 0 public tables without RLS. Public Auth settings show email enabled and Google/Apple/phone disabled. No owner identity or host verification was invented.

1. **Administrator:** owner selected an email account in chat, but the exact case-insensitive lookup found no registered account. The owner must first register and confirm it; then resolve its Supabase Auth user UUID. A trusted operator can then grant the initial private role for that exact account, after checking it is not blocked/anonymous. Never infer admin rights from email text, profile fields or user metadata; never expose bootstrap through the client. Verify admin login and that an ordinary member stays denied.
2. **Email and OAuth:** owner configures SMTP/delivery and production redirect allowlist, then tests confirmation, recovery and expired links. See AUTHENTICATION_SETUP.md. Google needs a PlugNear OAuth client and consent setup; Apple needs the developer setup. Keep unavailable providers disabled. Secrets belong in provider dashboards, not chat/source.
3. **Phone:** choose a supported SMS provider, complete applicable India sender/template setup and configure rate/spend/abuse limits. Enable only after real OTP delivery is tested. Email is the interim login method; do not enable auto-confirmation.
4. **Real host:** onboard a genuine host, review evidence privately, approve a real compatible charger, set their own VPA/payee details and open availability. The admin role does not itself verify a host. Check the site's access instructions and electrical suitability.
5. **Physical pilot:** with host/driver consent, test real GPS and directions, request/accept, correct UPI recipient/amount, real receipt checked in host's bank app, and session start/finish. Test cancellation, rejected/pending transfer and support/refund escalation. Do not treat a screenshot/reference or manual status as bank verification; do not pay twice.
6. **Google:** owner verifies Search Console and submits the sitemap; see SEARCH_VISIBILITY.md. Actual indexing/rankings/AI citations are unverified and Google-controlled.
7. **Security/operations:** review existing dependency audit findings and leaked-password-protection configuration before broad launch, and review real pilot terms/refund/support responsibilities. Do not resolve Expo audit findings with an unsupported forced SDK downgrade.
8. **Native stores:** Expo authentication is absent here. Owner must connect the intended Expo account/project securely and supply Maps restrictions/signing/store developer setup. No APK/AAB/IPA or store submission has been produced. See MOBILE_BUILDS.md and STORE_UPLOAD.md. This does not block web pilot testing.

## Deferred by MVP scope

Fleet billing, advanced slot scheduling, physical QR standees and crowdsourced broken-socket reporting remain deferred. PWA is deployed; a public paid marketplace launch is not validated until the real pilot and operational gates above pass. Claim360 resources were not changed.
