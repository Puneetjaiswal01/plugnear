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

## Domain state and DNS changes still required

Vercel accepted all three domain assignments with `verified: true`, but reports **DNS misconfigured**. Assignment verification is not DNS propagation or working HTTPS on the custom hostnames.

Current public DNS: `plugnear.in` and `www.plugnear.in` resolve to Hostinger parking at `2.57.91.91`. Authoritative nameservers are `aster.dns-parking.com` and `helios.dns-parking.com`. The public site still shows Hostinger's parked-domain page.

Vercel returned these project-specific recommendations:

| Record type | Host  | Target                              |
| ----------- | ----- | ----------------------------------- |
| A           | @     | 216.198.79.1                        |
| A           | @     | 64.29.17.1                          |
| CNAME       | www   | f1c618b5cccdf237.vercel-dns-017.com |
| CNAME       | admin | 2d2eb3ea66d90d57.vercel-dns-017.com |

Replace the parked apex address and current www CNAME; preserve unrelated MX/TXT records and the nameservers. Re-fetch Vercel's recommendations before changes if deployment configuration has changed. Promote the tested admin release before sending public traffic to admin.

No DNS writes were made. The Hostinger connector’s nine servers have now been registered successfully using the authorized configuration permissions. Restart the host once to load them; the first Hostinger call will initiate account consent if needed. Authentication and DNS access are not yet verified. No domain purchase or registrar transfer is required.
