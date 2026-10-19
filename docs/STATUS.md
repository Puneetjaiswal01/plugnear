# Actual results · 2026-10-19

| Check                           | Result                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Source audit                    | No v0.4 files found; user authorized new codebase                                                           |
| Dedicated Supabase              | PlugNear / yxisoddhwlzetrnfbbno / ap-south-1 / healthy                                                      |
| Claim360 changes                | None                                                                                                        |
| TypeScript                      | Mobile and admin pass                                                                                       |
| Domain + PostgreSQL tests       | 24 pass locally                                                                                             |
| Desktop/mobile browser tests    | 10 pass: auth gating, non-admin denial, responsive entry screens, guarded admin requests and error handling |
| Admin production build          | Pass; Vite dist generated                                                                                   |
| Marketplace web export          | Pass; Metro bundle generated                                                                                |
| Android and iOS exports         | Pass; Hermes bundles generated, no AAB/IPA                                                                  |
| Live migration                  | Not applied; two MCP write attempts returned expired request state; remote history rechecked                |
| Dependency audit                | 35 high, 7 moderate unresolved Expo toolchain findings                                                      |
| GitHub repository               | Local checkout exists; remote create denied by integration permission, subsequent lookup 404                |
| Vercel project/deployment       | Not created; automatic review rejected creation under the only exposed team, Claim360 CRM                   |
| Payments / UPI                  | Not provisioned or implemented; checkout unavailable                                                        |
| EAS / stores                    | Profiles prepared; no project/signing access, build or submission                                           |
| Live booking/payment end-to-end | Not performed; pending schema and payment setup                                                             |

Native exports preceded final text and maps-plugin adjustments. Final type/config checks cover those changes; signed native builds and physical-device checks remain outstanding.

The codebase, migration, tests and generated bundles can be reviewed locally. No deployment URL exists. See [release procedure](RELEASE.md), [security findings](SECURITY.md), and [next stages](ROADMAP.md).
