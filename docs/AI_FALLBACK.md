# AI provider fallback

Nexus uses the same provider chain for the personal assistant, readiness explanations and premium analysis explanations:

**Gemini → Groq → built-in progress guidance**

A provider is attempted only if its API key is configured. Each request has an 8-second deadline, including response reading. The two-provider chain therefore has approximately 16 seconds of external-request budget, plus local processing and database overhead. There are no retries against the same provider during a request. The next request starts with Gemini again; there is no shared circuit breaker or cross-request provider cooldown.

Network failures, timeouts, non-success HTTP responses (including rate limits and authentication failures), invalid JSON and invalid response shapes trigger the next configured provider. A successful validated response stops the chain. Empty summaries and oversized fields are rejected. If every configured provider fails, the response is labeled `template-fallback`. If neither key is configured, it is `deterministic-template`. The assistant shows Gemini/Groq and labels a backup-provider answer. Built-in guidance explains stored progress and cannot replace general AI tutoring.

## Setup

Set these server-only environment variables in the root `.env` locally or Vercel environment settings:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3.6-27b
```

Supply your own provider keys directly in environment settings, not in chat or browser code. Both keys are needed for AI-to-AI failover. With only Groq configured, it is used directly. Restart the server or redeploy after changing environment settings. Model access, quotas and billing depend on the provider account. No keys are included in the downloadable project.

## Data and scoring

Each attempted provider receives the learner's current question, opportunity title, server-calculated readiness/gaps, credit balance and proof count. Provider context excludes profile identifiers, email, private chats, credential fields, raw payment records and assessment answers. Information the learner includes in their own question is part of the question sent to providers. A fallback may send the same question and learning context to both Gemini and Groq.

Only validated explanation text and suggested actions are accepted. Scores and roadmap are attached from the deterministic server engine, not from model output. AI calls do not mutate user progress, assessment grades, evidence, credits or premium access. Provider bodies, keys and learner questions are not logged by this code.

## Verification

Automated tests use synthetic keys and simulated provider responses, including an actual 8-second abort deadline. Coverage includes primary success without a backup call, 429/503 responses, network failure, malformed JSON, empty content, provider skipping, both providers failing, no keys, minimal-context parity and unchanged user state. Live local setup was also verified with the configured keys: both providers returned valid answers, and a simulated primary outage switched to a real Groq response. The running assistant endpoint returned a Gemini answer. Provider quotas still apply; back-to-back requests can trigger built-in guidance.

API references: [Gemini generateContent](https://ai.google.dev/api/generate-content), [Groq text generation](https://console.groq.com/docs/text-chat), [Groq structured outputs](https://console.groq.com/docs/structured-outputs).

Current defaults cap output at 768 tokens. Gemini 3.6 Flash uses minimal thinking and Qwen 3.6 27B disables reasoning for short coaching replies; other model overrides omit those model-specific options.
