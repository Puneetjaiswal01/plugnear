# PlugNear infrastructure · 2026-10-19

The user explicitly approved using the existing Vercel team named **Claim360 CRM** for separate PlugNear projects. Only the team account is shared. No Claim360 project, database, domain, deployment or environment setting was modified.

## Created projects

| Application     | Vercel project | Project ID                       | Domain assignment                             |
| --------------- | -------------- | -------------------------------- | --------------------------------------------- |
| Public web app  | plugnear-web   | prj_meecuEpYoXLlnlDD7GOIXaXAu8xe | www.plugnear.in; plugnear.in redirects to www |
| Admin dashboard | plugnear-admin | prj_jIjyfAQQYgbLys7mM3BngVdf0cWE | admin.plugnear.in                             |

Team ID: `team_1u7aw5W8QOE1jWcv6odxACAV`. Node 24. Both projects currently accept locally built static artifacts, without a Git connection. Reconfigure the admin project to Vite with source root `apps/admin` when Git deployment is enabled. The first admin deployment failed because the source root was incompatible with the uploaded artifact; the dedicated PlugNear project was corrected and redeployed successfully.

## Actual deployment results

- Public app: **READY**, deployment `dpl_C8Wr2923AE2mbWCstwXh554sK5y4`, https://plugnear-web.vercel.app. Vercel assigned its first deployment to its production target even though preview was requested. This is a pre-launch artifact, not a verified marketplace release.
- Admin preview: **READY**, deployment `dpl_4nMT3oHuxsFYqfcxFpNKvNdvrsV9`, https://plugnear-admin-pznci8bjq-puneetjaiswal01s-projects.vercel.app. It uses Vercel authentication protection. It has not been promoted to production because the full backend flow remains unverified.
- Browser smoke checks of the served pages returned HTTP 200, the correct page titles, visible email/login controls and no JavaScript page errors. The admin preview was accessed using the platform's temporary share-access mechanism; that token is not committed or included here.
- No successful live booking/payment workflow has been demonstrated. Database migration, auth provider settings, payments, GitHub permissions and store signing remain outstanding as described in RELEASE.md.

## Domain state — updated after manual Hostinger changes

The user applied the required records at Hostinger. Vercel confirmed `misconfigured: false` for `plugnear.in`, `www.plugnear.in` and `admin.plugnear.in`. The public site now serves over verified HTTPS, and the apex redirects to www. No DNS writes were performed by the assistant. Admin still requires a production release.

See [public website release](WEBSITE_RELEASE.md) for the current deployment, smoke checks and remaining product limits. Earlier artifact deployment IDs above are retained as history; they are superseded for the public web project.

## Updated production state · 20 October 2026

Public web production: `dpl_AFgfoBmpdrJ7Wi2P39Accr8AjuQ8` READY. Separate admin production: `dpl_HqPreUJi1VeziQb8YXh6auWLiUz7` READY at https://admin.plugnear.in. Current source is on public GitHub main (owner-approved visibility). The owner-approved marketplace migration is deployed to the dedicated Supabase project. No Claim360 resource changed. Third-party identity/SMS, merchant activation, first verified admin, store signing and full live transaction testing remain separate launch blockers. Earlier preview-only and pending-migration notes above are historical.

## PWA hostname and backend · 20 October 2026

app.plugnear.in is attached to the dedicated PlugNear web project. Required Hostinger CNAME: `app` → `f1c618b5cccdf237.vercel-dns-017.com`. Current Vercel DNS inspection reports no CNAME/A record and `misconfigured: true`; hostname reachability remains unverified. Production `dpl_3Qi5qjg1rwC9xhSbkBVqS7UZeje4` is READY and the www `/app/` fallback passed live PWA/offline checks. PostGIS 3.3.7 and the MVP/checkout-hardening migrations are applied only to PlugNear. No Claim360 resource was changed.
