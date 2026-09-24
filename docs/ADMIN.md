# Private owner dashboard

Open `/admin` after signing in with your email code. The Admin sidebar link appears only for the owner.

## Enable access

1. Set `ADMIN_EMAILS` to your approved email addresses separated by commas in the root `.env` locally, or in Vercel environment variables for the deployed project. Leave it empty to disable all admin access. It accepts a comma-separated list of approved addresses.
2. Configure the SMTP account and EMAIL_FROM using EMAIL_SETUP.md. Gmail works with a Google App Password. Keep these values on the server; never prefix them with `VITE_`.
3. Restart locally or redeploy Vercel after changing environment variables.
4. Sign out and sign back in using the code delivered to your inbox. Open `/admin`.

A locally displayed preview code does not verify mailbox ownership and cannot grant admin access. Demo sessions and sessions created before this feature also cannot access the admin API. Access is checked on every request against the configured email and a signed email-OTP authentication claim. Changing the configured owner revokes the old owner's admin access after restarting/redeploying.

The three user-approved owner addresses are configured in the local private `.env`. Set the same list in Vercel environment variables when deploying. The shareable `.env.example` intentionally leaves it blank. Screenshots and automated tests use synthetic accounts, never a default administrator.

## Available data

The read-only dashboard includes registered and demo account counts, searchable paginated user summaries, positive-score skills, verified proof counts, completed sessions/challenges, SkillCredit balances, sandbox premium unlocks and settled sandbox payment counts. Account classification uses the reserved demo email suffix. It does not expose chats, passwords, OTP challenges, or private credentials. Counts reflect stored records, not inferred monthly activity or subscription revenue.

`GET /api/admin/overview?page=1&search=&type=registered` accepts `registered`, `demo` or `all`, returns 20 rows per page, and requires owner authorization. The MongoDB aggregation projects only summary fields and paginates the directory. Summary cards cover all stored accounts; search/type filters apply to directory rows only. All API responses are marked `Cache-Control: no-store`.

## Revenue limitation

The app currently has sandbox/Testnet payment scaffolding and no live-money receipt ledger. Real revenue is explicitly reported as **not connected** (`amount: null`). Sandbox payments, premium previews and SkillCredits are not sales or paid subscriptions. Reporting actual sales/refunds requires a live payment provider, verified server-side receipts and a durable money ledger. Vercel public-preview configuration keeps payments disabled.

## Verification

The server tests cover owner access, ordinary-user denial, old-session denial, preview-OTP denial, demo denial, unset-owner denial, safe response fields, validation and pagination. MongoDB smoke tests exercise the projected admin query and literal search escaping. Browser tests exercise the real admin API with an isolated signed test session, directory search and mobile layout; these do not send live email. See screenshots/admin-desktop.png and screenshots/admin-mobile.png.


## Current OTP delivery: Nodemailer

OTP delivery now uses Nodemailer SMTP. Any earlier Resend setup instructions above are superseded by [EMAIL_SETUP.md](EMAIL_SETUP.md). Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and EMAIL_FROM. Resend API keys are no longer used. SMTP credentials are still required before live email delivery works.
