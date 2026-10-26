# Nearby search session recovery — 26 October 2026

## Observed problem

The discovery UI remained open while PostgREST received the project publishable key as its Authorization bearer instead of a user access token. Live edge logs reported 401 responses; database logs reported `permission denied for function get_nearby_chargers`. Only credential type/prefix and status were inspected; no user access/refresh token was extracted or logged. The reason the original user's stored session was lost is not established by those logs.

Live inspection confirmed the dedicated PlugNear Mumbai project was healthy. The exact seven-argument nearby function already granted EXECUTE to authenticated, denied anon, used SECURITY INVOKER, and enforced active/confirmed account and RLS-visible approved-host listings. This was not a missing authenticated grant and did not justify anonymous access or SECURITY DEFINER.

## Fix

- Add a protected Data API fetch guard after the SDK has selected the Authorization header. A missing/user-less bearer or project-key fallback is rejected locally before sending the request.
- Notify the app to return to sign-in, show a clear recovery message, end its local session and unmount discovery/polling. A server 401 follows the same recovery path. Requests/writes are never automatically replayed.
- Keep Auth/settings requests working without a user session. Do not misclassify a 403 access-control denial as an expired login.
- Only display authenticated screens when the session has a user ID and a non-project access token. These client checks are UX protection; JWT validation and authorization remain enforced by Supabase.
- No API key, service-role key, SQL grant, RLS policy or database schema was changed.

## Verification

Typecheck, web build, 52 unit/database tests and 72 Chromium browser tests passed. Regression cases remove browser session storage while discovery remains mounted, verify no anonymous RPC is sent, check a user-token 401 returns to sign-in, and advance the clock beyond the polling interval to verify no repeated searches. Existing successful request/UPI fixture flows passed.

The live rollback-only SQL smoke passed PostGIS discovery, available/busy state, reservation and manual-UPI session lifecycle under authenticated roles; all fixtures were rolled back and no transfer sent. This confirms database behaviour, not a real owner login or physical charging test. The owner must sign in privately after deployment and retry the map search with a fresh session.

Security advisors still flag leaked-password protection as disabled; it is a separate configuration follow-up: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Private tables with RLS/no direct policy remain intentionally inaccessible via direct client queries. No Claim360 resource was involved.

## Deployment

Source `8f544c7` deployed READY as `dpl_FmVybMPNw5PvvyLv9JCsbdFLE2ze` on app.plugnear.in / www.plugnear.in. Six deployed-frontend desktop/mobile tests passed for missing-session blocking, server-401 recovery/polling stop and successful window selection/request. Auth/database endpoints were intercepted in those browser checks; no real user credentials or new bookings were used. Source CI run 40271667422 was still running at the final check. Refresh/reopen and sign in privately to retry the owner's actual session.
