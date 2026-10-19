# Staged delivery

1. **Local foundation delivered:** audit, new monorepo, marketplace and admin interfaces, guarded database workflow migration, local authorization tests, bundles and release configuration.
2. **Connected backend validation pending:** reauthorize Supabase writes, deploy migration, configure confirmation redirects/SMTP, bootstrap verified administrator, test REST grants and concurrent requests on PostgreSQL 17.
3. **Payments pending provisioning:** India merchant onboarding, UPI eligibility, secure orders/webhooks/reconciliation/refunds and host settlement. Keep checkout unavailable until verified in sandbox and production.
4. **Product hardening pending:** date/time pickers and India timezone display, charger photos/private verification documents, booking completion and energy metering, password recovery, account deletion, notification delivery, privacy/terms/support pages, server pagination and operational monitoring. Verification currently records evidence descriptions for manual review; it is not automated KYC.
5. **Release pending access:** dedicated GitHub repository permissions, Hostinger DNS connection and final Vercel release verification, EAS account and signing, branded store assets, physical-device testing and full live end-to-end tests.

The web map centres on the device location using Google Maps; multi-marker charger results are implemented in the native map. Booking search returns at most 200 matching nearby records; admin lists show at most 500 recent records. Production-scale pagination and clustering remain necessary.
