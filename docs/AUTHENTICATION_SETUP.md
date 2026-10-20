# PlugNear registration setup

## Implemented

- Email/password registration with email confirmation, then sign-in.
- Google OAuth with PKCE and a native system-browser session. Native callback accepts only `plugnear://auth/callback`; the authorization code is exchanged once even when the browser and deep-link event both deliver it.
- Phone registration/sign-in via Supabase SMS OTP, with India number normalization, a resend cooldown and a code bound to the number that received it. Changing the number invalidates the displayed verification form. Server rate limits and CAPTCHA remain necessary; the client timer is not a security control.
- Apple OAuth button on iOS, using the same protected callback flow, for the social-login release.
- Account shows login email/phone and their confirmation status. A saved contact phone is separate from a verified login number; editing it does not change an authentication identity.

The app reads the dedicated project's public authentication settings and disables methods that are not enabled. A failed settings request keeps optional providers disabled. No service-role or provider secret is embedded in the app. Profile data and user metadata never grant administrative roles.

## Observed live configuration

On 19 October 2026, the allowlisted project's `/auth/v1/settings` returned HTTP 200: email enabled, Google disabled, Apple disabled, phone disabled. No provider credentials or live auth settings were changed. Google/Apple/SMS are therefore implemented client flows, **not verified live login integrations**.

## Enable only on the dedicated PlugNear project

Project: https://supabase.com/dashboard/project/yxisoddhwlzetrnfbbno/auth/providers

1. In Google Cloud, create/select a PlugNear-owned project, configure the OAuth consent screen, verified domain `plugnear.in`, privacy policy and support contact. Create an OAuth **Web application** client for the Supabase browser flow. Add the redirect URI `https://yxisoddhwlzetrnfbbno.supabase.co/auth/v1/callback`.
2. In Supabase Auth → Providers → Google, configure that client ID and client secret and enable Google. Keep the secret only in provider configuration. The application uses the external browser, not a native Google SDK; do not put the web client secret in Expo or Vercel client variables.
3. In Supabase Auth → URL Configuration, use `https://app.plugnear.in/app/` as the site URL and allow exact production redirects `https://app.plugnear.in/app/`, `https://app.plugnear.in/app/?mode=host`, `https://www.plugnear.in/app/`, `https://www.plugnear.in/app/?mode=host` and `plugnear://auth/callback`. Add only necessary explicit development/preview routes. Do not allow arbitrary wildcard redirect hosts. Keep PKCE verification enabled.
4. Enable phone authentication and configure a supported SMS provider in Supabase. For Indian delivery, complete applicable provider/telecom DLT sender/template setup and verify delivery before launch. Configure OTP expiry, rate limits, abuse controls and SMS spend limits; do not enable automatic phone confirmation. Test both new-account registration and returning-user login on real numbers.
5. Configure Sign in with Apple through an Apple Developer account, associated service/app identifiers, keys and return URLs as required by Supabase's current Apple provider guide. Review Apple's login-services rules before App Store submission. Do not ship a nonfunctional Apple alternative while Google is offered as the primary third-party login.
6. Configure custom SMTP and verify email confirmation delivery. Test sign-up, duplicate accounts, expired links, cancellation, logout, refresh, callback interception and app restart on actual Android/iPhone builds. PKCE email links opened on a different device/browser may not have the verifier; users can confirm then return to their original app and sign in.
7. Different login methods can create separate accounts. Do not merge by matching phone/email strings or edit another user's profile to link identities. Implement authenticated identity linking separately and test it before offering it in the UI.

Local browser tests stub provider responses. No real SMS was sent, real account registered or external OAuth consent completed during those tests. The marketplace migrations and rollback-only authorization tests have since passed. Real provider delivery and physical-device login tests remain release gates.

References: [native OAuth](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [phone OTP](https://supabase.com/docs/guides/auth/phone-login), [Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple).
