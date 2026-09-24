# Architecture

See SOURCE_NOTES.md for provenance.

## Repository

`apps/web` is React 19, Vite and TypeScript. It uses accessible DOM skill bars and original inline SVG illustrations, DOM-based controls, responsive CSS and lucide icons. `apps/server` is Express 5 and TypeScript. `packages/shared` contains API/domain types. `scripts` contains Mongo integration verification and the opt-in Testnet payer. `tests` contains Playwright journeys; API tests live under `apps/server/tests`.

## Boundaries

Browser → same-origin `/api` → authentication/validation → pure domain engines → state repository. Vite proxies to port 4000. The compiled server can also serve the built frontend. Session JWTs use HttpOnly, SameSite cookies, with Secure enabled for HTTPS. Passwords use salted scrypt. Origin checks guard browser mutations, request sizes are capped and endpoints are rate-limited. This is a hackathon scaffold, not an audited production identity system.

## Scoring

SkillMatch = sum(weight × min(currentScore / requiredScore, 1)) / sum(weights) × 100.

Readiness = round(0.40 × SkillMatch + 0.20 × Evidence + 0.15 × Experience + 0.15 × Projects + 0.10 × Activity).

Seed factors: evidence 85, experience 80, projects 90, activity 82. Seed skill match 68. Raw total 77.9 rounds to 78. Version is `readiness-v1`. Contributions are returned to the UI for explanation. This score measures preparation, not selection probability.

The gap engine lists below-target requirements, distinguishes missing (zero) from weak skills and ranks by weighted skill contribution available. Displayed gap impact excludes the separate evidence bonus. Passing a foundational check sets that skill to at least 60 and adds two evidence-factor points. Simulator projects the same changes on a clone, with deduplicated selected skills.

## NexusMatch and Skill GPS

NexusMatch excludes peers who are below 60 or less than 15 points ahead of the learner. Ranking weights: expertise .28, teaching .18, availability .15, reliability .12, same campus .08, language .07, knowledge distance .07, reciprocity .05. The preferred knowledge distance is 40 points. Each active learner above two subtracts two ranking points. All components and explanations are exposed. Credits never buy rank.

GPS orders Docker and testing before CI/CD. The default route estimates 4 + 4 + 3 days; peer assistance saves one day per step. These are disclosed heuristic estimates, not a trained optimizer or guaranteed timeline.

## Persistence and concurrency

Memory mode is used by unit/API tests. File mode atomically renames a replacement JSON file and serializes mutations within one process; run only one file-mode server. MongoDB mode uses a single-document atomic update on `(id, revision)` and retries conflicts. A successful challenge writes skill, evidence, completion marker, readiness snapshot and ledger entry together. Stable challenge IDs enforce once-per-account rewards even across concurrent requests. Booking the same peer/skill returns the existing session. Sandbox settlement is idempotent.

## AI and payments

Gemini receives only derived score/gap/opportunity data, not passwords, full profiles or wallet keys. Responses are schema-validated; timeout, malformed output and provider errors use a disclosed template fallback. Generated text cannot update numerical state.

Sandbox implements HTTP 402, a user-bound expiring request, simulated settlement and resource retry. Real Testnet uses `@x402/express`, `@x402/core`, and `@x402/avm` middleware with the GoPlausible facilitator. The payer is a separate explicit CLI. Settlement proof is returned by the middleware in PAYMENT-RESPONSE. Durable Testnet payment receipt reconciliation and browser wallets remain integration work.
