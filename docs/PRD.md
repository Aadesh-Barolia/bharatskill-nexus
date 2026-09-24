# BharatSkill Nexus — implemented hackathon PRD

See SOURCE_NOTES.md for provenance; this is an implementation document, not the missing original artifact.

## Audience and problem

Students at a campus such as ABES need a practical connection between their current skills, peer learning and a reachable opportunity. They need to understand a gap and what to do next, not merely see an unexplained match percentage.

## Delivered demo journey

Landing → isolated demo user → interactive skill bar chart → SWE internship readiness 78% → three missing/weak skills → non-mutating simulator → 11-day GPS or estimated 8-day peer-assisted route → context-ranked peer → simulated session → server-graded challenge → skill evidence → readiness improvement → auditable credits → premium sandbox 402 flow.

## Acceptance criteria

- Full journey works locally with no API keys or MongoDB installation.
- API calculates readiness and rankings. Browser only displays returned numbers.
- Simulator cannot alter earned evidence, scores or ledger.
- Passing Docker, Testing and CI/CD challenges moves readiness to 83%, 86%, 92%, respectively.
- Each successful check credits 30 points once. Starting demo balance 120, final 210.
- Failed checks leave skill state and credits unchanged.
- Sessions, payments and ledger are scoped to the authenticated user.
- Refresh and server restart preserve file or MongoDB progress.
- Mobile and reduced-motion views remain usable. The interface uses DOM charts and SVG illustrations and does not require WebGL.
- Sandbox payment is clearly labeled and cannot masquerade as an on-chain transaction.

## Scope boundaries

Use the seeded demo user for the hackathon. Registration and login are implemented with blank new profiles, but the end-to-end real-student onboarding/verification workflow is not production-ready. Demo people, opportunities and session completion are simulated. A quiz verifies foundational knowledge, not practical project quality. External AI and real Testnet settlement are opt-in integrations.
