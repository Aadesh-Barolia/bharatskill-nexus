# Implemented API contract

See SOURCE_NOTES.md for provenance. Base `/api`; JSON input/output. Authenticated endpoints require the HttpOnly `nexus_session` cookie or a signed Bearer JWT. Errors use `{error:{code,message}}`. Validated malformed bodies return 400, authentication failures 401, forbidden actions 403, unknown resources 404 and state conflicts 409. Default rate cap is 240 requests/minute/IP; credentials routes 20/minute. All responses disable caching.

| Method | Route                                              | Contract                                                                                           |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | /health                                            | storage, payment mode, demo availability                                                           |
| POST   | /auth/demo                                         | new isolated seeded learner and cookie, 201; disabled outside demo mode                            |
| POST   | /auth/register                                     | name, email, password (10–128 chars); blank profile, 201                                           |
| POST   | /auth/login                                        | email, password; cookie and safe profile                                                           |
| POST   | /auth/logout                                       | clear cookie                                                                                       |
| GET    | /me                                                | safe authenticated profile                                                                         |
| PATCH  | /me                                                | name, campus, languages (Hindi/English)                                                            |
| GET    | /dashboard?opportunityId=swe-intern&skillId=docker | profile, catalogs, readiness, gaps, roadmap, ranked peers, balance, mode, challenge questions      |
| GET    | /skills/graph                                      | skill nodes and source/target edges                                                                |
| GET    | /opportunities                                     | curated demo items and total                                                                       |
| GET    | /opportunities/:id/readiness                       | score, version, factors, contributions, explanation                                                |
| GET    | /opportunities/:id/gaps                            | missing/weak skills and skill-component impact                                                     |
| POST   | /opportunities/:id/simulate                        | `{skillIds:[...]}`; current/projected score and hypothetical=true; never persists                  |
| GET    | /opportunities/:id/roadmap                         | estimated days, peerDays, projected readiness and ordered steps                                    |
| GET    | /peers?skillId=docker                              | ranked items, numerical breakdown, reasons, reciprocal skill                                       |
| POST   | /sessions                                          | peerId, skillId; eligible user-scoped session; same pair returns existing session                  |
| POST   | /sessions/:id/complete                             | simulate completion; demo only; idempotent                                                         |
| GET    | /challenges                                        | public questions/options, no answer keys                                                           |
| POST   | /challenges/:id/submit                             | `{answers:[1,1,0]}`; three zero-based choices; passed or correct/total; completed session required |
| GET    | /credits                                           | signed ledger entries and computed balance                                                         |
| POST   | /demo/reset                                        | reset only own demo aggregate                                                                      |
| POST   | /agents/explain                                    | opportunityId; structured summary/actions, provider and deterministic readiness                    |
| POST   | /premium/deep-readiness-analysis                   | opportunityId; 402 when unpaid; report when authorized                                             |
| POST   | /payments/:id/sandbox-settle                       | settle own unexpired sandbox request, only in sandbox+demo mode                                    |

## Sandbox premium flow

1. Request premium resource with `{opportunityId:"swe-intern"}`.
2. Receive HTTP 402 with `payment.id`, expiry, price and explicit sandbox label. This simulation deliberately does not impersonate a signed x402 protocol payment.
3. POST `/payments/{id}/sandbox-settle`.
4. Retry the resource with `X-Demo-Payment: {id}`. Authorization is bound to user, opportunity and expiry. No real transaction hash is invented.

## Algorand Testnet flow

Set PAYMENT_MODE=testnet and configure a valid public receiver. The actual SDK middleware emits PAYMENT-REQUIRED and processes PAYMENT-SIGNATURE. Its PAYMENT-RESPONSE header contains settlement output. `scripts/pay-testnet.ts` signs via a local payer and retries. Sandbox settlement is disabled. The request body is validated before paid middleware runs. No mnemonic is accepted by the application API or sent to the browser.

## Scoping and limitations

Demo catalogs are intentionally small and unpaginated. Session self-completion is not a production verification mechanism. No public endpoint allows direct mutation of scores or ledger entries. Cross-user session/payment access is denied. Production-grade refresh tokens, account recovery, durable payment reconciliation and live session services remain out of scope for this hackathon build.

## Peer conversation endpoints

All routes require authentication. The current user identity always comes from the session, never a submitted sender ID.

| Method | Route               | Behavior                                                                     |
| ------ | ------------------- | ---------------------------------------------------------------------------- |
| GET    | /chats              | Member-only conversation summaries, with the last message                    |
| POST   | /chats              | `{peerId}` creates or reuses the owner's room for a demo peer                |
| GET    | /chats/:id          | Member-only room and latest 100 messages; optional ISO `before` cursor       |
| POST   | /chats/:id/invite   | Owner-only one-use invitation; rotates any previous token                    |
| POST   | /chats/:id/join     | `{token}` consumes a valid invitation and adds the authenticated participant |
| POST   | /chats/:id/messages | `{text,clientId}` sends plain text; UUID clientId makes retries idempotent   |

Invite tokens are stored as SHA-256 digests, stripped from every public response, and consumed on join. Messages are limited to 2,000 characters and 30 sends/minute/IP, with a 1,000-message room cap. Rooms have two participants. Unknown/non-member room access returns 404. Chat histories are omitted from profile/dashboard responses and read only through member-checked routes. The browser polls every three seconds while visible. Demo reset preserves chat history.

## Personal assistant

`POST /api/assistant` requires authentication. Body: `{ "question": "Help me learn Docker", "opportunityId": "swe-intern" }`. The trimmed question must be 3–1000 characters and the opportunity must exist. Rate limit: 10 calls per minute per IP in addition to the global API limit. Returns `{ summary, nextActions, provider, readiness, roadmap }`; `provider` is `gemini`, `deterministic-template`, or `template-fallback`. This endpoint does not mutate learning state, store questions, or award credits. Provider calls exclude identity credentials and peer conversations. The client renders provider output as plain text.

## Skill library

All learning endpoints require the existing session cookie.

| Method and path                          | Behavior                                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/learning`                      | Returns 36 guide previews, levels, prerequisites, locked flags, account premium status and sandbox availability. No lesson bodies.                                                         |
| `GET /api/learning/:id`                  | Returns guide lessons. Advanced content requires a server-side library entitlement; otherwise 403. Unknown IDs return 404.                                                                 |
| `POST /api/learning/:id/start`           | Adds the guide's skill to the current profile once at score 0; existing skill scores are unchanged. The same premium check applies to advanced guides. No credits or evidence are awarded. |
| `POST /api/learning/premium/demo-unlock` | Requires `{ "confirm": true }`, demo mode and sandbox payment mode. Stores a sandbox library entitlement. Repeated activation is idempotent; no payment occurs.                            |

`UserState.learningPremium` is optional/null or `{ source: "sandbox", activatedAt: ISODateString }`, also modeled in MongoDB. A missing entitlement is free access. Sandbox entitlement is accepted only in demo+sandbox mode and is revoked on demo reset. Users cannot write it through profile-edit routes. It is separate from existing per-analysis payment records.

## Email authentication (supersedes earlier password endpoints)

POST /api/auth/otp/request accepts {email, name?}. Returns {requestId, expiresIn:600, resendAfter:60, delivery} without disclosing whether an account exists. Public delivery uses Resend and never returns a code. Only the loopback non-production demo can return previewCode with delivery local-preview. Provider failure returns 503 and invalidates the pending challenge; a resend inside 60 seconds returns 429.

POST /api/auth/otp/verify accepts {email, requestId, code}. Code must be six digits. A valid, unexpired challenge retrieves or creates the account, consumes the challenge once and sets the existing HttpOnly session cookie. Wrong, expired, exhausted or replayed codes return 401. New accounts start with no earned progress. The old password /auth/register and /auth/login routes are removed. Demo login remains gated by demo mode.

## Foundation assessments

Authenticated assessment endpoints and their validation, grading and retry behavior are specified in [ASSESSMENTS.md](ASSESSMENTS.md). All grading remains server-side; answer keys are excluded from start responses and returned only in submitted result reviews.
