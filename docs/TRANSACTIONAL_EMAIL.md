# PlugNear transactional email setup

Only configure **PlugNear** project `yxisoddhwlzetrnfbbno`. Do not reuse or edit Claim360 sender settings or API keys. Existing public business contacts stay unchanged; `noreply@plugnear.in` is a transactional sender, not a new support mailbox.

## 1. Verify the domain in Resend

Create/sign in to the intended Resend account, choose an appropriate plan and add `plugnear.in` under Domains. The free tier has sending limits; check the provider's current limits before inviting users. Copy the exact DNS rows Resend provides. Add those rows at Hostinger without changing the existing @/www/app/admin records or unrelated mail/DNS records. Do not invent DKIM values, overwrite existing SPF indiscriminately or add duplicate SPF policies at the same hostname. Click Verify in Resend and wait for verified sending status before replacing the working SMTP configuration.

DNS names/values are public and can be shared for setup. API keys, SMTP passwords, mailbox passwords and confirmation/reset links must not be sent through chat.

## 2. Configure Supabase custom SMTP

Create a dedicated sending-access Resend API key scoped to the PlugNear sending domain when supported. Enter it only into Supabase's protected SMTP password field.

Open https://supabase.com/dashboard/project/yxisoddhwlzetrnfbbno/auth/smtp and enable custom SMTP **after domain verification**:

| Setting | Value |
| --- | --- |
| Sender email | `noreply@plugnear.in` |
| Sender name | `PlugNear` |
| Host | `smtp.resend.com` |
| Port | `465` (implicit TLS) |
| Username | `resend` |
| Password | Dedicated Resend API key, entered privately |

Save. Do not put the SMTP/API key in `EXPO_PUBLIC_*`, `VITE_*`, client files, source control or a public deployment. Resend SMTP documentation: https://resend.com/docs/send-with-smtp . The integration uses provider-confirmed SMTP settings, not a mailbox purchased from Hostinger.

## 3. Redirects and branded templates

Site URL: `https://app.plugnear.in/app/`. Allow exact production callbacks listed in AUTHENTICATION_SETUP.md. The 21 October read-only verification probe already returns to the app, but confirmation/recovery still require fresh real-delivery tests.

In Supabase Email Templates:

- Confirm signup: subject `Confirm your PlugNear email`; paste `supabase/templates/confirmation.html`.
- Reset password: subject `Reset your PlugNear password`; paste `supabase/templates/recovery.html`.

Keep `{{ .ConfirmationURL }}` exactly as written. Do not replace it with a hardcoded URL, expose a token in website copy or disable email confirmation. These template files are prepared, not automatically applied to live Auth configuration.

## 4. Verify delivery and abuse controls

Use independent consented test accounts and the real browser flow, not mocked responses. Check sender branding, Inbox/Spam, domain verification results, app return, expired/used links, confirmation followed by sign-in, resend cooldown, password reset and login with the replacement password. Cross-browser PKCE recovery may need a fresh request from the browser where it will be completed. Do not request or share users' passwords or live email links.

Set conservative server email rate limits and provider quota/spend controls. The client resend countdown is a convenience, not a server security control. CAPTCHA needs its own complete client/provider configuration before being enabled; never enable it in Auth alone and break sign-in. Monitor delivery/bounce/complaint events and suppress invalid destinations. Do not send promotional campaigns through authentication messages.

The app's confirmation resend response is deliberately neutral: it does not confirm whether an address is registered, and API acceptance is not proof that an email reached an inbox.
