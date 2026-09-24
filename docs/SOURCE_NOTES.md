# Source provenance and implementation decisions

The referenced ChatGPT conversation `6aa62fbe-b618-83e8-94e3-22b02d2afa73` was retrieved, including the product, peer matching and visual strategy discussions. Its messages reference PRD.md, ARCHITECTURE.md, DATABASE_SCHEMA.md and API_SPEC.md as generated artifacts, but those artifact bodies were not present in the retrieved conversation or local workspace. The four documents in this repository describe the implementation built here; they are **not recovered originals**. Exact conformance to the missing originals cannot be established until they are supplied.

The uploaded ten-slide hackathon deck was available and its text was extracted directly. Relevant sources:

- Slide 2: fragmented skills and opportunities, underused peer learning, evolving skills and autonomous assistance.
- Slide 3: peer exchange, SkillCredits, skill graph, matching, skill-gap roadmaps, x402 and Algorand Testnet via GoPlausible.
- Slide 6: React/Vite, Express, MongoDB Atlas, Gemini, custom matching and x402 AVM.
- Slide 8: modular, campus-first and algorithm-first MVP.
- Conversation: explainable readiness; evidence-weighted skills; deterministic server ranking; eight-factor NexusMatch; knowledge distance and load penalty; simulator; peer-assisted GPS; internal credits separate from blockchain payments.

Implementation choices made where no final specification was recoverable:

1. Use the conversation's 40/20/15/15/10 readiness formula. Calibrate disclosed seed inputs to 77.9, displayed as 78. Passing all three checks yields 91.9, displayed as 92.
2. Store learner progress, sessions, evidence and ledger in one MongoDB aggregate with revision-based compare-and-swap. This gives atomic progress/reward updates without requiring a replica set. Keep opportunities and peers as separate indexed catalog models. Catalog configuration is read from versioned TypeScript seed data in this demo; MongoDB mirrors it for future ingestion.
3. File persistence is the default for a credential-free demonstration. MongoDB is selectable and tested separately. No silent fallback on MongoDB failure.
4. Seeded people and opportunities are demo fixtures inspired by the supplied narrative. They do not represent actual availability, jobs, academic verification or real sessions.
5. Session completion is explicitly simulated. Three-question knowledge checks are server-graded foundational evidence, not verified project execution. Each check has one reward per account.
6. The browser demonstrates an explicitly labeled sandbox 402 flow. The separate Testnet adapter uses the actual x402 middleware; real funding and settlement require user-supplied accounts. No real settlement was performed during this build.
7. Gemini is optional and returns validated explanations and next actions. Without a key the application uses disclosed templates. Scores and peer ranking never depend on generated text.
8. The scope prioritizes the requested complete hackathon path. Automated opportunity ingestion, real video/chat sessions, production mentor verification, teaching payouts across real accounts, application submission, password recovery and a production wallet interface remain future work.

Technical references checked during implementation:

- [React Three Fiber installation and React version compatibility](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Algorand official x402 tutorial](https://dev.algorand.co/resources/x402-on-algorand/)
- [NexStudio](https://nexstudio.tech/) was unavailable to the text fetcher; visual direction follows the detailed recovered discussion, rather than copied assets or layouts.

The visual implementation uses original typography-led composition, olive/cream colors, a functional 3D constellation, a sticky scene through three landing chapters, pointer parallax and reduced-motion behavior. No reference-site assets were copied.

## Subsequent user-directed design and chat revision

The user requested a less template-like design, livelier colors, scroll effects, smooth motion, a custom cursor and peer communication. The public page was recomposed with oversized editorial typography, cream/ink surfaces and violet/orange/acid accents. Lenis and GSAP implement smoothing and scroll choreography. The workspace adopts the same color system. Persistent, member-only text conversations are now implemented for two real signed-in users via one-use invitations; seeded peer profiles remain demo data and do not send automated replies. Earlier references to chat as future work are superseded by this revision; video, presence and notification features remain future work.

## Current learning-platform revision

The user subsequently requested a Codecademy-inspired learning-tool layout and removal of the 3D network. That request supersedes the original 3D visual direction above. The current implementation uses original learning illustrations, searchable path cards and selectable skill bars. Three.js and React Three Fiber were removed. Source links above document earlier research, not current dependencies.
