# PlugNear — individual / sole-proprietor merchant application

A private limited company is not automatically required for payment gateway onboarding. Individual/unregistered-business and sole-proprietor eligibility depends on the provider, business model and documents. Do not select a company type you do not have. A sole proprietorship is not the same as a limited-liability company.

## Proposed onboarding description (owner to review)

Brand: PlugNear
Website: https://www.plugnear.in/
Contact: puneetjaiswal@zohomail.in
Business model: India-first EV charging services marketplace connecting drivers and commercial fleets with independent charger hosts. Planned customer collections are in INR, including UPI, with platform commission and verified host settlements. The product is in early access and has not started taking online payments.

The legal applicant name must match the actual PAN/KYC and settlement account requirements. The brand name is not evidence that a company exists.

## Application steps

1. Start at the provider's official signup page. Use an email/mobile you control and select your real individual/unregistered-business or proprietorship category as offered. Do not claim private-limited status.
2. Complete PAN, identity/address verification, bank verification and the business-proof combination requested for your category. Upload these only to the provider's secure portal. Never put PAN, Aadhaar, bank statements, cancelled cheques, passwords or OTPs into this repository or chat.
3. Describe the marketplace model accurately and explicitly request Razorpay Route or Cashfree Easy Split eligibility for third-party charger-host onboarding, commission, settlement holds, refunds and disputes. A standard gateway approval alone is not split-settlement approval. Obtain the provider's answer for your applicant category before collecting for hosts.
4. Ask what business evidence and settlement account type the current application needs; do not assume a personal account is acceptable for every product. Ask for written pricing/settlement terms. Gateway eligibility does not establish legal/tax compliance for operating the marketplace.
5. Supply working support, privacy and deletion URLs. Booking/cancellation/refund terms, actual service availability and live checkout are still unfinished. Do not represent test checkout or the current early-access website as a fully operational paid service.
6. Start integration in test mode. Keep server keys and webhook secrets in secure backend configuration only, never in Expo/Vite public variables. Go live only after provider approval, verified host KYC/settlement flow, signature checks, idempotency, refunds and real-device end-to-end tests.

## Message to provider (draft; not sent)

Hello, I operate the PlugNear brand as an individual/sole-proprietor business in India and am preparing an EV charging marketplace at www.plugnear.in. Drivers will pay in INR, including UPI, for services from independent charger hosts. The platform plans to retain a commission and settle the host portion through your approved marketplace product. We are currently in early access and not collecting online payments.

Please confirm whether my actual applicant category can be onboarded for your payment gateway plus Route/Easy Split, what business proofs and bank account are required, how host KYC, settlements and refunds must work, and the applicable pricing. Please identify any requirements that must be completed before live activation.

## Official references reviewed 20 October 2026

- https://razorpay.com/blog/minimum-documents-payment-gateway-onboarding-india/
- https://razorpay.com/route/
- https://www.cashfree.com/docs/payments/split

No merchant account has been created, KYC submitted, agreement accepted, provider contacted or money collected by the agent. Incorporation, tax/GST obligations and any sector requirements need assessment against the actual operating model; forming a company and payment-provider activation are separate decisions.
