# Skill assessments

Open **Assessments** in the workspace sidebar, choose a skill and start a four-question foundation check. Each guide also has **Check my foundations**. After submitting, review the result and use **Open my practice guide** to open the matching beginner guide.

## Coverage and behavior

There are 48 authored questions across 12 areas: public speaking, communication, problem solving, technical fundamentals, Git, network marketing, cybersecurity, data analysis, critical thinking, teamwork, time management and Python. These are brief, informal foundation knowledge checks, not psychometrically validated tests, practical assessments, certifications or proof of professional proficiency. Advanced learning guides remain premium-gated; foundation assessments are free.

Questions show one at a time with radio-button options, progress and a 30-minute attempt expiry. Previous answers can be changed before submission. An unexpired attempt is reused when starting the same skill again. Unfinished selections are saved per account in this browser tab’s session storage. Refreshing /assessments restores the current question and selections after the server confirms the attempt. Back to assessments clears the draft. Submitted results are saved server-side. Results remain available after reloading. There is a 60-second cooldown before retaking a completed skill assessment. Retakes use the same foundation questions, so subsequent scores may reflect familiarity with those questions.

## Deterministic scoring

The server calculates `round(correct / 4 * 100)`. Results are labeled Foundation ready at 75–100, Developing foundations at 50, and Start with the basics below 50. These are product learning labels, not validated proficiency classifications.

The quiz may establish a capped foundation baseline: `profile score = max(existing score, round(quiz percentage * 0.6))`. Thus a 75% result can establish 45/100, and a perfect result can establish at most 60/100. A stronger existing score never drops. Quiz-based confidence is at most a 0.35 floor and does not replace stronger confidence. No verified evidence, evidence-factor points, premium entitlement or SkillCredits are awarded. Readiness is recomputed by the existing engine; it changes only if the skill is required for the opportunity. A dated readiness snapshot is recorded when the profile skill score increases. Wrong answers produce topic-specific revision steps; all-correct results recommend applying the knowledge and seeking peer feedback.

## API

All endpoints require the existing authenticated session and return private no-store responses.

- `GET /api/assessments`: catalog, latest submitted result per skill and retained history.
- `POST /api/assessments/:skillId/start`: create or resume an owned attempt; return prompts/options without answer keys or explanations.
- `POST /api/assessments/attempts/:id/submit`: submit exactly four integer answer indices (0–2), as `{ "answers": [1, 2, 0, 1] }`. Unknown fields such as score are rejected. Grading and progress changes are atomic with attempt completion.
- `GET /api/assessments/attempts/:id`: retrieve an owned submitted result, including answer review and practice steps. Unsubmitted results return 409.

Unknown skills/attempts and another user's attempts return 404. Malformed submissions return 400, expired attempts 410, and cooldowns 429. Repeating identical submitted answers returns the saved grade without applying progress again; changing submitted answers returns 409. Each attempt records the bank version `foundation-v1`; incompatible versions are rejected rather than regraded silently. Keep old banks keyed by version if expanding this into long-term versioned assessments.

## Persistence and tests

UserState includes optional `assessments` for backward compatibility. MongoDB embeds strict assessment subdocuments: ID, skill ID, bank version, start/expiry/submission timestamps, answers, percentage and profile score before/after. Memory and file stores use the same shape and atomic mutation path. Up to 60 attempts are retained, including active ones; expired unsubmitted attempts are removed when starting another. Demo reset clears assessment progress.

Server tests cover private access, hidden keys, strict input, server grading, repeated/concurrent submissions, account isolation, capped baseline, unchanged stronger scores, no reward/proof inflation, expiration and file persistence. MongoDB smoke tests cover concurrent submission and results after reconnect. Browser tests cover catalog/search, radio selection, previous/next, feedback, saved results after reload, guide links and mobile layout. Existing demo and skill-library browser journeys still pass.

No new environment variables, email service or AI API key are required for assessment grading. Public account sign-in still depends on the existing OTP email setup.

Direct local link: http://localhost:5173/assessments. Vercel also rewrites /assessments to the frontend. Draft answers do not control grading; submitted answers are still validated and graded on the server.
