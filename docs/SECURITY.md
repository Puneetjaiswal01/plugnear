# Audit and security review · 2026-10-19

The workspace contained no source repository or archives. GitHub searches found no PlugNear repository. The user authorized a new application. The dedicated Supabase project was inspected read-only: healthy, Mumbai, PostgreSQL 17.11.

## Historical remote state before rollout

Three public tables (`profiles`, `chargers`, `bookings`) with RLS and zero rows at audit; two migrations, no Edge Functions. The existing exclusion constraint protects only confirmed bookings. Existing RPCs check driver/owner identity and use an empty search path, but are exposed security-definer functions. Default grants include broad table privileges, including TRUNCATE, for client roles.

The security advisor reported [`btree_gist` in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [two exposed security-definer booking RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Initial write attempts failed; the reviewed migration was subsequently applied with explicit owner approval on 20 October 2026. The current security advisor no longer reports these baseline findings.

## Applied migration safeguards

Every new application table has RLS. Exact column grants replace default grants. Anonymous, unconfirmed and blocked accounts are excluded. Private `account_access` cannot be edited by clients; user-editable metadata never grants authority.

Public booking RPCs are security-invoker wrappers around guarded private functions with empty search paths. Private functions revoke PUBLIC execution, require identity and check ownership or admin authority. Keep the private schema excluded from PostgREST's exposed schemas.

A charger row lock serializes reservations; a GiST exclusion constraint prevents overlapping requested and confirmed bookings. Adjacent `[start,end)` windows are allowed. Request keys bind retries to identity and payload. Prices use stored rates and validated energy. Clients cannot write payment state. Unanswered requests expire at the earlier of 24 hours and their start; the next reservation attempt lazily releases expired holds. An automated lifecycle worker and payment holds remain unfinished.

Hosts cannot self-verify or approve. Discovery hides unverified or blocked hosts. Removing availability does not cancel existing bookings. Admin decisions require notes and create audit rows atomically. Admins cannot block themselves or other admins through the API.

Native sessions use versioned SecureStore chunks and foreground token refresh. Admin sessions are memory-only. Apps enforce the dedicated backend hostname. Only publishable keys are configured; environment files and outputs are ignored. No server/payment secrets are in client configuration.

## Validation limits

Tests execute actual PostgreSQL through PGlite 18 with btree_gist, emulated auth roles and retrieved baseline migrations. This does not prove PostgreSQL 17 deployment, live Auth, concurrent network requests, payment webhooks or native map rendering. Browser tests use explicit test-only fixtures for signed-in scenarios; production code has no fixture fallback.

## Dependency audit

`npm audit --omit=dev --audit-level=high` reports **42 findings: 35 high, 7 moderate**, mainly the Expo/Metro build chain. The registry reported no compatible fix for the high advisories and suggested a breaking Expo downgrade; that downgrade was not applied. Resolve upstream updates or review mitigations before release.

- [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
- [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)

Production requires a fresh audit, live RLS and API verification, physical-device tests, private verification documents, payment reconciliation and privacy/account-deletion controls. This review does not certify production security.

## Registration review · 19 October 2026

Social login uses PKCE, native system-browser authentication and an exact scheme/host/path callback check. Duplicate callback delivery shares a single exchange promise. OAuth secrets are not client configuration. Optional providers fail closed when unavailable; live public settings show Google/Apple/phone disabled. OTPs are verified by Supabase against the number that received the request; changing form input removes the verification state. Client cooldown is UX only: server rate limits, anti-abuse controls and SMS spend limits must be configured before enabling phone login. Contact phone updates are not represented as verified identities. No profile grants, RLS, database functions or admin authorization were modified. Identity linking and account merging are not implemented. Unit and mocked browser tests passed; external-provider and device verification remain required.

## Live verification · 20 October 2026

Confirmed live RLS, restricted grants and requested/confirmed overlap protection. A rollback-only SQL transaction exercised guarded reservation creation, idempotent retries, overlap exclusion and non-admin denial without persisting fixture accounts/listings/bookings. This is not independent concurrent-client/payment verification. Security advisor still reports [leaked password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); enable it through an authorised Auth settings session. The private `account_access` table is deliberately deny-by-default with RLS/no policies and no client table grants, as reflected by the [informational advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

The original GitHub CI failure was caused by missing test client configuration. CI now uses explicit invalid fixture keys, and browser fixtures deny unmocked requests to the real backend. No live credentials are needed by CI. Password recovery uses Supabase PKCE and the PASSWORD_RECOVERY event; native callbacks preserve the SDK flow ID when supplied. New support and deletion entry points do not add a privileged account-deletion endpoint.

Fresh production dependency audit on 20 October 2026: 23 findings (16 high, 7 moderate, zero critical). Several suggested fixes are breaking downgrades to Expo 44 / React Native 0.72 and were not applied. Compatible upstream/toolchain remediation remains a release gate; the earlier 42-finding result above is historical.
