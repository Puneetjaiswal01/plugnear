# Deployment and release procedure

## Dedicated infrastructure

Backend allowlist: `yxisoddhwlzetrnfbbno` only. Never run commands from a Claim360 checkout or reuse its `.vercel` settings, service credentials or EAS identity.

GitHub: source is pushed to https://github.com/Puneetjaiswal01/plugnear on `main`. The user created the repository and explicitly approved public source publication. Initial integration-based creation and visibility changes were denied; push succeeded after repository access was available. See [connection verification](GITHUB_CONNECTION.md).

Vercel: separate `plugnear-web` and `plugnear-admin` projects now exist in the existing team, following the user’s explicit approval to share that team account. The public website is verified at https://www.plugnear.in with DNS configured at Hostinger. See [infrastructure results](INFRASTRUCTURE.md) for project IDs, READY deployment URLs, exact DNS records and verification limits. No Claim360 project was changed.

## Database rollout

The reviewed baseline migration is now applied (20 October 2026). The following steps remain the rollout reference for subsequent changes; do not replay it.

1. Back up PlugNear, re-inspect its schema and verify only the two audited migrations exist. Resolve any drift or active overlapping bookings before rollout.
2. Review the third migration. It revokes broad client grants, routes booking changes through guarded functions and changes the exclusion constraint to reserve pending requests too.
3. Apply only the pending migration through authenticated Supabase tooling, explicitly targeting `yxisoddhwlzetrnfbbno`. The MCP write attempts in this session failed with an expired request state. No Supabase CLI access token or database password was provisioned. Reconnect the write integration or provision credentials securely; never put them in chat or public environment variables.
4. Run security/performance advisors and query the resulting constraints and grants. Verify host, driver, stranger and admin accounts through the REST API, including simultaneous reservations from two clients. Local tests use PGlite PostgreSQL 18; the live project uses PostgreSQL 17, so live verification remains required.
5. Assign the initial admin only after independently verifying the intended account. Execute through a trusted SQL connection: `update private.account_access set role='admin' where user_id='<verified-user-uuid>';`. Clients never receive a role-editing API. Do not promote someone based on a display name or user metadata.
6. Configure custom SMTP for public registrations, rate limits, password policy (at least 8 characters), and allowed confirmation redirects: `plugnear://auth/callback` plus the final web URL. The committed config is local development only; no production auth setting was changed.

## Payments and India launch

Provision an India-capable merchant account with confirmed UPI support, marketplace settlement/KYC and refund support. Vercel Marketplace discovery requested CLI authentication and could not complete; no provider was installed. Verify eligibility before choosing a provider; UPI must not be assumed available merely because an SDK supports payments.

The next stage must implement authenticated server-created orders using the stored booking amount and INR currency, explicit provider idempotency, short payment holds, raw-body webhook signature verification, independent order/payment reconciliation, event deduplication, atomic paid-state transitions and refund/cancellation reconciliation. Never mark paid from a client callback or accept an amount supplied by the app. Client grants currently prohibit changing `payment_status` or price.

## Web dashboard

Use only the dedicated project's publishable key as `VITE_SUPABASE_PUBLISHABLE_KEY`; set `VITE_SUPABASE_URL` to the allowlisted backend. Deploy a preview, check login, non-admin denial, admin review, audit visibility, blocking and disputes, then stage and test the production build. Promote only after the entire driver→host→payment→admin flow passes.

## Store builds

The checked-in bundle identifiers `in.plugnear.mobile` are proposed and need ownership confirmation. Configure a PlugNear-owned Expo/EAS project, Android Maps key restricted to the package and signing certificate, and Apple/Google developer accounts. A branded launcher icon is now configured; complete the remaining splash/store screenshot review.

From `apps/mobile`, link EAS to that dedicated project, configure signing, then use the production profiles in `eas.json` for Android AAB and iOS IPA builds. No EAS project ID, Expo token, signing material, Apple team or Play service account is configured here. Cloud build attempts stop at Expo authentication; no APK/AAB/IPA was built or submitted. See [current mobile build results](MOBILE_BUILDS.md).

Before submission implement and test password recovery, in-app account deletion and its web request route, privacy/terms/support pages, accessibility, notifications, physical-device permission and map checks, booking completion/metering, settled pricing/tax/refund policy and India regulatory requirements. Complete Apple privacy labels and Google Data Safety disclosures based on actual data collection. Do not claim background location; the app requests foreground location only.
