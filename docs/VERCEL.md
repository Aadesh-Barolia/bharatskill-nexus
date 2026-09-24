# Publish the public preview on Vercel

Deployed on 14 September 2026 at https://bharatskill-nexus.vercel.app in `nom11/bharatskill-nexus`. The dedicated Atlas `NexusCluster` uses database `bharatskill` and a scoped read/write application user. Production secrets are stored in Vercel; local `.env` files and `.vercel` metadata are excluded from the source archive and uploads.

Current blocker: Gmail rejects the configured SMTP credentials with authentication error 535, also reproduced locally. Public pages and MongoDB health work, but email sign-in is not ready for users until a valid Gmail app password is saved as `SMTP_PASS` in Vercel and the project is redeployed. Do not treat the public URL as a completed onboarding launch yet.

## 1. Create the accounts

Create/sign in at [Vercel](https://vercel.com/signup). Create a [MongoDB Atlas deployment](https://www.mongodb.com/docs/get-started/) for saved users and messages. Use a dedicated database and application database user, and configure Atlas network access for the hosting environment. Keep the connection string private.

## 2. Create the Vercel project

You can deploy the local repository directly without creating a GitHub repository. Open a terminal in `bharatskill-nexus` and run:

```sh
npx vercel login
npx vercel
```

Complete Vercel's browser sign-in yourself. Choose your account and create a project. Keep the root directory at the monorepo root, where `vercel.json` and `package.json` live; do not select `apps/web`. The supplied configuration builds both applications, serves `apps/web/dist`, and routes `/api/*` to the Node function.

The initial static home page can deploy before database setup, but accounts will return a setup-unavailable error until the following environment variables are configured. Do not invite users yet.

## 3. Add project environment variables

In Vercel Project Settings → Environment Variables, add:

| Variable           | Value                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                                                                                                                 |
| `DEMO_MODE`        | `false`                                                                                                                      |
| `PAYMENT_MODE`     | `disabled`                                                                                                                   |
| `STORAGE`          | `mongo`                                                                                                                      |
| `MONGODB_URI`      | Your Atlas connection string for this project's database                                                                     |
| `JWT_SECRET`       | A cryptographically random secret of at least 32 characters                                                                  |
| `CLIENT_ORIGIN`    | Exact HTTPS production project origin shown by Vercel, with no trailing slash                                                |
| `TRUST_PROXY_HOPS` | The verified trusted proxy count for your deployment; start at 0 and configure after checking Vercel's forwarded-IP behavior |
| `GEMINI_API_KEY`   | Optional; leave unset for built-in guidance                                                                                  |

Generate a secret locally if needed:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Store it directly in Vercel, not chat or committed source. Do not use `VITE_` variables for secrets. Use separate databases/secrets and the exact preview origin if enabling authenticated preview deployments. Do not reuse production data in arbitrary previews.

Select Node 24 in the Vercel project runtime settings. Build command is `npm run build`; output is `apps/web/dist`; install command is `npm ci --include=dev`. These are already in `vercel.json`.

## 4. Deploy and check the public address

After adding settings, deploy again:

```sh
npx vercel --prod
```

Check the public URL in an incognito browser and on a second device:

- `/` always shows the landing page, even after logging in. The workspace logo links back home.
- `/app` opens the workspace after authentication; browser back/forward works.
- `/api/health` reports demo false, payment disabled, storage mongo.
- Registration starts at zero credits and zero readiness; add a free library skill and verify it survives logout/login.
- Advanced guides remain locked. Demo unlock and sandbox settlement endpoints reject requests.
- Premium analysis is visibly disabled rather than pretending a charge succeeded.
- Confirm HTTPS cookie behavior, request-origin enforcement and real client-IP handling. Configure Vercel Firewall limits for public traffic; in-memory Express rate limits are per instance and do not form a global distributed limiter.
- Review Vercel deployment protection settings so the production address is accessible to your intended audience.

## Current public-preview boundaries

This is a learning-library public preview, not a completed campus marketplace. Accounts, skill enrollment and saved chat invitations work. Opportunity and recommended peer records remain examples and are labelled as such. New guide content is authored practice material, not graded courses. Real peer discovery, verified sessions, evidence submission, account recovery, moderation/reporting, and subscription billing need further implementation before a full campus rollout. Existing frontend signup UI and beginner/intermediate guides are available, but advanced access cannot be purchased yet.

## Deployment implementation

`api/index.ts` exports the existing Express API without starting a port listener. The `/api/:path*` rewrite sends nested routes to this function. It lazily reuses Mongo initialization and requires MongoDB, HTTPS origin, demo disabled and payments disabled. The adapter trusts the single Vercel edge hop and removes the unused RFC Forwarded header; Vercel overwrites X-Forwarded-For as documented in its [request headers reference](https://vercel.com/docs/headers/request-headers). Local Express proxy settings remain separate. The public HTML and assets are served separately so an unavailable API does not remove the home page. `.vercelignore` excludes local secrets, data and test artifacts. `tsconfig.vercel.json` validates the adapter against the compiled backend.

Run `npm run build`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run test:vercel` locally. The last check uses a temporary real Mongo database and the function adapter. It verifies local integration, not Vercel's hosted routing/build behavior. A live deploy remains required to verify the public URL and platform settings.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Express support](https://vercel.com/docs/frameworks/backend/express), [project configuration](https://vercel.com/docs/project-configuration).

## Required for email authentication

Before inviting users, configure Nodemailer using SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and EMAIL_FROM; see [EMAIL_SETUP.md](EMAIL_SETUP.md). For Gmail, use a Google app password for the account in SMTP_USER. Missing/failed delivery blocks signup and login. Public responses never reveal OTP codes. Password login has been removed; existing users verify their email instead. MongoDB stores shared, single-use challenges. Tests mock delivery; a real inbox test remains necessary after updating the rejected credentials.

## Owner dashboard

Add server-only `ADMIN_EMAILS` with the approved email addresses separated by commas, then redeploy. Sign in with a code delivered to that mailbox and visit `/admin`. The local approved list must also be set in Vercel; no default owner is built into the code. Local preview codes cannot grant access. See ADMIN.md for access rules and revenue limitations.


## Current OTP delivery: Nodemailer

OTP delivery now uses Nodemailer SMTP. Any earlier Resend setup instructions above are superseded by [EMAIL_SETUP.md](EMAIL_SETUP.md). Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and EMAIL_FROM. Resend API keys are no longer used. SMTP credentials are still required before live email delivery works.
