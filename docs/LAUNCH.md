# From hackathon preview to a real learning platform

The redesigned site runs locally at http://localhost:5173. It has not been published. The layout is inspired by learning-platform conventions, including Codecademy's path discovery and clear progression; the branding, copy and SVG illustrations are original.

## What is already real

- Registration creates a separate account with zero skill scores, zero evidence factors and no initial credits. The demo button explicitly creates a seeded learner.
- Authentication uses a password hash and an HttpOnly session cookie.
- Profiles, earned demo progress, evidence and credit history persist in file storage or MongoDB.
- Two registered people can exchange saved messages through a private invitation. Sample peers do not generate fake replies.
- Readiness, gaps, simulator results and peer ranking are computed on the server. AI only supplies explanations.

## What still uses built-in data

- Opportunities and recommended peers come from `apps/server/src/catalog.ts`. MongoDB also receives seeded catalog records, but the API/engines still read the TypeScript catalog. Merely choosing MongoDB does NOT make recommendations live.
- The landing page's three learning directions describe the demo, not a completed interactive course library. The cards open the corresponding demo workspace.
- The 78% learner, its factors and the 78 → 92% story are demonstration data. A new account is empty; it should never inherit this score.
- Session self-completion is a demo action. There is no real peer confirmation or mentor review workflow yet.
- Assessment questions are built-in learning content. Keeping authored lessons and question banks is normal; learner records and verified outcomes need to be real.
- Payments are sandbox or Algorand Testnet only. Neither is a production billing system.

## Build the real-data path before inviting a public cohort

1. **Onboard each learner.** Ask for a target role, known skills, language and availability. Store self-reported experience separately from verified proficiency. Provide a baseline assessment and evidence submission. Keep progress empty until actual activity earns it.
2. **Use real members for NexusMatch.** Add opt-in discoverability, teachable skills and availability to user profiles. Query consented member profiles from MongoDB and run the existing deterministic ranking against them. Exclude the current user, blocked users and demo accounts. Show an honest empty state until peers join. Chat room creation currently starts with a catalog peer ID; update it to accept real, discoverable member IDs and consent-based requests.
3. **Manage opportunities and curriculum.** Add staff-only create/edit/archive tools for courses, lessons, assessments and opportunities. Store source URLs, requirements, dates and active status. Switch catalog reads to database repositories. Start with manually verified opportunities; add licensed feeds later. Do not present invented companies as hiring partners.
4. **Verify actual work.** Learners submit projects or complete assessments. A peer confirms a session and an authorized reviewer approves evidence using a rubric. Compute evidence factors from accepted records. Preserve server-only answer keys, attempt limits and idempotent skill/credit awards. Do not allow a browser to set its own score or credit balance.
5. **Prepare account and community operations.** Add email verification, password recovery, profile editing/deletion, block/report controls and an admin moderation queue. Test cross-account authorization and invitation revocation. Define retention for private messages and evidence.
6. **Make premium analysis optional.** The disabled payment mode is now implemented for a public learning-only preview. Use `DEMO_MODE=false` and `PAYMENT_MODE=disabled`. Do not just remove that guard and accidentally expose simulated settlement as billing. Leave real-money payments until a separately verified integration exists.

Start with a small invited campus cohort and a few real peer mentors. Validate the complete journey: new account → evidence/assessment → live peer match → chat → confirmed session → verified progress → one ledger award. This is the prerequisite for calling the site a real-user beta.

## Hosting the application

The selected host is now **Vercel**, following the user's request. See [Vercel setup](VERCEL.md) for the exact project configuration, account/database setup and deployment commands. The project includes a Node function adapter, static frontend output, a stable public `/` and workspace `/app`, and a `PAYMENT_MODE=disabled` option. The previous Render instructions are superseded.

## Release acceptance checks

- New accounts have no seeded achievements; old demo accounts cannot appear in real member search.
- Opportunity, course and peer lists come from managed database records.
- Two users can chat, confirm a session and record verifiable progress without demo endpoints.
- Repeated requests cannot duplicate rewards; unauthorized users cannot access messages or evidence.
- Accounts survive restart/redeploy because storage is Atlas, not an ephemeral local file.
- Mobile registration and keyboard/reduced-motion navigation work.
- Payment behavior is unambiguous: disabled/free, Testnet preview, or a separately validated real billing integration.

## Reference documentation

- [Render: deploy an Express application](https://render.com/docs/deploy-node-express-app)
- [MongoDB: create and connect to an Atlas deployment](https://www.mongodb.com/docs/get-started/)
- [Codecademy: learning-platform reference](https://www.codecademy.com/)

No hosting account, domain, database or payment service was created by this redesign task.
