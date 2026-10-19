# PlugNear · Mobile 0.5 development

India-first peer-to-peer EV charging for Expo iOS, Android and web, with a separate React admin dashboard. This is a new codebase authorized after the v0.4 source could not be located. The public marketing website is deployed at **https://www.plugnear.in/**; the marketplace remains in early access and is **not ready for store submission**.

The only allowed backend is **PlugNear**, `yxisoddhwlzetrnfbbno`, Mumbai (`ap-south-1`). Claim360's repository, database and deployment were not modified.

## Run

Use Node 24 and `npm ci`. Copy each app's `.env.example` to `.env.local`, then set the dedicated project's **publishable** key. The API URL is already specified. Never place server secret keys in either app.

- `npm run mobile` — Expo development server; native maps require a development build and a restricted Google Maps Android API key.
- `npm run admin` — Vite admin dashboard.
- `npm run build:website` — public website and embedded early-access app.
- `npm run typecheck` — both applications.
- `npm test` — domain and real PostgreSQL/PGlite authorization and reservation tests.
- `npm run build` — admin production bundle.
- `npm run export:web` — marketplace web bundle.
- `npx playwright install chromium && npm run test:e2e` — desktop/mobile access and responsiveness checks. These are browser smoke tests; they are not a live booking or payment test.

The first two SQL migrations were retrieved from the existing PlugNear migration history. `20261019042055_marketplace_expansion.sql` is the new migration, generated with Supabase CLI and tested locally, **not applied remotely**. Do not replay the existing migrations against the live project. See [release instructions](docs/RELEASE.md).

## Implemented locally

- Supabase email/password registration, email confirmation callback and login; native sessions stored in SecureStore and foreground token refresh.
- Location permission handling, native map markers, web map, proximity/connector/power/price filters, and external Google Maps navigation.
- Charger registration and manual host verification requests, with admin-reviewed approval.
- Explicit host availability windows, server-priced energy reservations, idempotency, host acceptance/decline, driver cancellation and issue reporting.
- Admin charger, host, booking, user and dispute views with reviewed actions and audit records. Admin access comes from a private database table; clients cannot assign roles.
- RLS, restricted column grants, account blocking and a GiST exclusion constraint preventing overlapping pending or confirmed reservations.
- Separate app configurations, EAS build profiles, Vercel dashboard configuration and CI validation.

Online payments are intentionally unavailable. There is no payment provider, UPI checkout, signature verification or webhook deployed. This stage does not collect money.

See [actual validation and blockers](docs/STATUS.md), [audit and security](docs/SECURITY.md), and [next stages](docs/ROADMAP.md).

Pre-launch Vercel artifacts and domain assignments now exist. Custom DNS remains parked at Hostinger; see [infrastructure results](docs/INFRASTRUCTURE.md). These deployments do not establish a working booking/payment release.

See [public website release results](docs/WEBSITE_RELEASE.md) for the latest verified deployment.
