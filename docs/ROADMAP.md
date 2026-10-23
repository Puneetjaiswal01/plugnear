# PlugNear staged delivery — revised focus

1. **Delivered:** approved identity, responsive public site, existing Expo/admin foundation and tested reservation/RLS migration. Website scope covers private cars, taxis, bikes/scooters, three-wheelers, commercial EVs and mixed fleets, with household, business, parking and depot hosts. Fleet pilot planning and a locally downloadable brief are available.
2. **Pilot discovery:** choose one city/operating zone and a real rider/fleet cohort; collect route/dwell, vehicle/OEM-charger and site constraints. Validate demand and host readiness before claiming coverage.
3. **Micro-host foundation:** the reviewed PlugNear baseline is deployed; next add versioned vehicle-class/site/point/equipment/compatibility models and private evidence review. Add site operating hours, reviewed electrical/site-load limits, metering and unit-specific conflict prevention. Current connector-based listings are not the micro-host model.
4. **Verified charging and payments:** completion/readings, authenticated server pricing, India merchant onboarding and UPI eligibility, signed provider events, idempotent settlement/refunds, host payout/KYC and appropriate accounting/tax arrangements. Keep payments unavailable until verified.
5. **Fleet operations:** organisation/membership RLS, driver/vehicle assignments, access policies, repeat reservations and session-cost visibility. Add consolidated billing and priority access only after metering and ledger validation; those capabilities are not yet live.
6. **Release hardening:** auth/SMTP, password recovery and account deletion, notification delivery, privacy/terms/support, production pagination/monitoring, dependency remediation, physical-device checks and signed app-store builds. GitHub source is connected. Password recovery and public support/privacy/terms plus email-based deletion initiation are implemented; full deletion processing, verified CI, and live end-to-end checks remain release gates.
7. **Later option:** white-label management for RWAs, hotels and office/parking sites, using the validated host/session stack. Do not split the first release across three unvalidated businesses.

[Strategy](STRATEGY.md) records the market assumptions and pilot learning goals. [Implementation requirements](MICROHOST_REQUIREMENTS.md) define the upcoming domain model and authorisation contract. The local planner is a planning aid, not evidence of deployed fleet integrations or smart hardware.

## Competitive review — 23 October 2026

See [COMPETITOR_RESEARCH.md](COMPETITOR_RESEARCH.md) for the 20-reference evidence review, status corrections and prioritized backend/operational acceptance criteria. This stage adds a local host cost guide and explicit request time/duration/price planning; recurring calendars, privacy-separated access instructions, session-linked incident reports, reviews, telemetry and automatic refunds remain separate work.
