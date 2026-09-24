# MongoDB schema

See SOURCE_NOTES.md for provenance. Mongoose schemas are in `apps/server/src/models.ts`.

## users

Unique `id` (UUID) and normalized unique `email`; optional salted `passwordHash`; profile name, campus, languages; `revision` for optimistic concurrency.

Embedded bounded skills: `id`, `name`, score 0–100, confidence 0–1, evidence titles, related skill IDs. Factors evidence, experience, projects and activity are bounded 0–100.

Embedded sessions: id, peerId, skillId, booked/completed status, createdAt, completedAt. Evidence: id, skillId, type, title, verified, createdAt. Ledger: id, signed amount, reason, stable reference, createdAt. Snapshots: score, timestamp, reason. Payments: id, sandbox/testnet mode, required/settled status, createdAt, expiresAt, optional transaction, opportunityId. `completedChallenges` records unique logical reward sources.

Indexes: unique user id, unique email; sparse nested payment transaction index. Ledger balance is computed as the sum of entries. Anti-duplication is enforced by an atomic compare-and-swap mutation of the entire aggregate, not by a MongoDB unique index on an embedded array (which would not enforce uniqueness within one document).

## opportunities

Unique id; title, company, location, type, description, tags, demo flag; requirements array with skillId, required target and weight. The seed operation upserts only configured demo IDs and preserves user data.

## peers

Unique id; name, initials, campus, skill score map, bounded teaching/availability/reliability values, languages, wanted skills, active learners, completed sessions and avatar color. Peers are catalog fixtures, not separate login accounts in this demo.

## Demo reset

Only the authenticated demo account may reset its aggregate. Registered accounts cannot call demo reset. Other learners and all catalogs remain untouched. A new demo login creates a fresh independent learner; existing cookies resume their own progress.

## Scale-up path

Split high-volume sessions, evidence, ledger, payments and snapshots into collections when needed. Use replica-set transactions for atomic cross-account rewards and ledger updates, plus unique `(userId, eventReference)` indexes. Add event ingestion, verifier identities, retention policy, pagination, mentor availability and payment reconciliation before production rollout.

## Peer conversations (revision)

The owning user's aggregate now embeds `conversations`: room id, ownerId, demo peerId, title, member ids/names, messages, hashed invite token, creation/update timestamps. Messages carry id, clientId, senderId, text and sentAt. Nested indexes cover room IDs and member IDs. Each room is written through the same revision-based atomic mutation as other state, including message deduplication and invitation consumption. This supports file and MongoDB persistence without cross-document transactions. New arrays default to empty; existing file profiles remain compatible. Each room is capped at two participants and 1,000 messages. Dedicated message collections and cursor pagination in the UI are the next scaling step.

## Learning entitlement

The user aggregate now includes optional/null `learningPremium` with `source: "sandbox"` and `activatedAt` as an ISO date string. Old records without this field remain free accounts. Profile enrollment uses the existing skill subdocument, adding a missing skill at score/confidence 0 with empty evidence/related arrays. Neither operation changes readiness factors or the ledger. File and Mongo mutations preserve atomicity and duplicate enrollment protection.

## EmailOtp collection

One challenge per normalized email: id (UUID), email (unique), name, digest (HMAC-SHA256 keyed by the server secret over request ID/email/code), expiresAt (TTL index), resendAt, attempts. Expiry is checked on every verification independently of TTL cleanup. A valid verification atomically clears digest and attempts while retaining the resend cooldown. Resend replaces the previous ID/digest. Challenges are excluded from profiles and proof exports.

## Assessment attempts

User aggregates now optionally include `assessments`, a bounded list of up to 60 embedded attempts. Each contains id, skillId, version, startedAt, expiresAt and optional submittedAt, answers, score, profileBefore and profileAfter. Attempt completion and profile baseline updates share one atomic mutation. See ASSESSMENTS.md for retention and retry behavior.
