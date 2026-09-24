import { Router } from 'express';
import { z } from 'zod';
import type { UserState, LearningLevel } from '@nexus/shared';
import { Store } from './store.js';
type Track = {
  id: string;
  name: string;
  category: string;
  topics: [string, string, string];
  concepts: [string, string, string];
  practice: [string, string, string];
};
const tracks: Track[] = [
  {
    id: 'public-speaking',
    name: 'Public speaking',
    category: 'Communication',
    topics: ['Speak with structure', 'Tell a persuasive story', 'Present under pressure'],
    concepts: [
      'A clear opening, one main idea and a short closing help an audience follow your message.',
      'A concrete example connects a claim to the audience’s needs. Separate facts from interpretation.',
      'Difficult questions need a pause, a direct answer and an honest statement of uncertainty.',
    ],
    practice: [
      'Record a two-minute introduction with one main idea.',
      'Present a five-minute proposal with a story and supporting evidence.',
      'Invite a peer to challenge your proposal and review how you handled the questions.',
    ],
  },
  {
    id: 'communication',
    name: 'Communication skills',
    category: 'Communication',
    topics: [
      'Listen and explain clearly',
      'Give useful feedback',
      'Navigate difficult conversations',
    ],
    concepts: [
      'Active listening means checking understanding before responding, using a short paraphrase and an open question.',
      'Feedback is easier to act on when it names an observable behavior, its impact and a specific next step.',
      'Separate the issue from the person. Identify shared goals and agree on a next action without forcing agreement.',
    ],
    practice: [
      'Ask a peer about a recent project and summarize it in three sentences.',
      'Rewrite vague criticism as specific, respectful feedback.',
      'Role-play a disagreement over a deadline and write a shared action plan.',
    ],
  },
  {
    id: 'problem-solving',
    name: 'Problem solving',
    category: 'Thinking skills',
    topics: ['Define the problem', 'Compare possible solutions', 'Reason through complex systems'],
    concepts: [
      'Describe the gap between the current and desired state before choosing a solution. Record constraints and unknowns.',
      'Compare alternatives using explicit criteria, trade-offs and a small experiment.',
      'Complex problems include feedback loops and unintended effects. Test assumptions and map dependencies.',
    ],
    practice: [
      'Turn a vague campus complaint into a measurable problem statement.',
      'Compare three fixes using impact, cost and uncertainty.',
      'Map the effects of a campus scheduling change and propose a reversible pilot.',
    ],
  },
  {
    id: 'technical-fundamentals',
    name: 'Technical fundamentals',
    category: 'Technology',
    topics: [
      'How computers and the web work',
      'APIs and data structures',
      'System design fundamentals',
    ],
    concepts: [
      'A browser sends requests to a server. Programs process input using instructions, memory and storage.',
      'An API is a contract for exchanging data. Choose data structures based on access and update patterns.',
      'System design balances correctness, reliability, latency and cost. Start from requirements, not a preferred tool.',
    ],
    practice: [
      'Draw a browser-to-server request and label each step.',
      'Design a small task-list API with inputs, outputs and error cases.',
      'Design a campus booking service and explain failure handling and trade-offs.',
    ],
  },
  {
    id: 'git',
    name: 'Git & version control',
    category: 'Technology',
    topics: ['Commits and repositories', 'Branches and pull requests', 'Advanced Git workflows'],
    concepts: [
      'A commit records a snapshot with a message. The working tree, staging area and repository are different states.',
      'A branch is a movable reference to commits. Small reviewed changes make collaboration easier.',
      'Rebase rewrites commit ancestry; merge preserves branch history. Reflog can help recover local references.',
    ],
    practice: [
      'Create a practice repository, inspect a diff and commit a small change.',
      'Create two branches and resolve a deliberate conflict in a disposable repository.',
      'Compare merge and rebase in a disposable repo and document a recovery exercise. Avoid rewriting shared history without agreement.',
    ],
  },
  {
    id: 'network-marketing',
    name: 'Network marketing',
    category: 'Business',
    topics: [
      'Relationships and ethical outreach',
      'Build a customer referral process',
      'Evaluate a referral business model',
    ],
    concepts: [
      'Understand the customer’s needs before offering a product. Use consent-based outreach and distinguish customer value from recruitment.',
      'A useful referral process tracks qualified interest, customer outcomes and permission to follow up.',
      'Evaluate product demand, costs, customer retention and incentive design. Recruiting people is not a substitute for real customer value; avoid income promises.',
    ],
    practice: [
      'Write a transparent outreach message that offers value and an easy way to decline.',
      'Sketch a consent-based referral journey and define meaningful customer metrics.',
      'Compare two hypothetical referral models for costs, incentives and customer value without assuming future earnings.',
    ],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    category: 'Technology',
    topics: [
      'Protect accounts and data',
      'Threat modeling and secure habits',
      'Defensive security assessment',
    ],
    concepts: [
      'Strong unique passwords, multi-factor authentication and updates reduce common risks. Recognize suspicious requests before acting.',
      'A threat model identifies assets, boundaries, plausible threats and mitigations.',
      'Defensive assessments require a defined scope and authorization. Document findings, prioritize fixes and verify remediation.',
    ],
    practice: [
      'Create a security checklist for a fictional student account.',
      'Draw the trust boundaries of a campus app and list mitigations.',
      'Review a local practice app you own for access-control and logging gaps, and write a remediation report.',
    ],
  },
  {
    id: 'data-analysis',
    name: 'Data analysis',
    category: 'Data',
    topics: [
      'Read and clean data',
      'Explore patterns with SQL',
      'Design an analytical investigation',
    ],
    concepts: [
      'Inspect missing values, units and duplicates before interpreting a dataset. Keep the original data and document transformations.',
      'Grouping and filtering reveal patterns, but correlation alone does not establish causation.',
      'A useful investigation starts with a question, identifies potential bias and quantifies uncertainty before presenting conclusions.',
    ],
    practice: [
      'Clean a small synthetic spreadsheet and log each decision.',
      'Use a sample sales table to compare categories and check your totals.',
      'Plan an experiment or observational study, identify confounders and write a cautious recommendation.',
    ],
  },
  {
    id: 'critical-thinking',
    name: 'Critical thinking',
    category: 'Thinking skills',
    topics: [
      'Check claims and sources',
      'Recognize bias and assumptions',
      'Make decisions under uncertainty',
    ],
    concepts: [
      'Distinguish a claim from the evidence offered for it. Ask what would change your mind.',
      'Consider selection bias, missing comparisons and alternative explanations.',
      'Make assumptions explicit and test whether a recommendation changes when those assumptions change.',
    ],
    practice: [
      'Compare two claims about a campus issue and identify their evidence.',
      'Find three alternative explanations for a fictional survey result.',
      'Write a decision memo with uncertainty, alternatives and a sensitivity check.',
    ],
  },
  {
    id: 'teamwork',
    name: 'Teamwork & leadership',
    category: 'Career skills',
    topics: ['Work well in a team', 'Coordinate a shared project', 'Lead through ambiguity'],
    concepts: [
      'Clear roles and small explicit commitments reduce confusion. Ask for help early and share progress.',
      'A shared plan needs owners, dependencies and a way to surface blockers.',
      'Leadership under uncertainty means explaining priorities, listening to dissent and adapting when evidence changes.',
    ],
    practice: [
      'Agree on roles and a definition of done for a small group task.',
      'Create a task board and run a short retrospective with a peer.',
      'Facilitate a scenario where priorities change and document the team’s revised plan.',
    ],
  },
  {
    id: 'productivity',
    name: 'Time management',
    category: 'Career skills',
    topics: ['Plan a focused day', 'Prioritize competing work', 'Build sustainable workflows'],
    concepts: [
      'A useful plan reserves time for a small number of concrete tasks and includes breaks.',
      'Urgency and importance are different. Compare deadlines, impact and effort before committing.',
      'A sustainable workflow limits work in progress, leaves room for uncertainty and includes regular review.',
    ],
    practice: [
      'Plan three learning tasks and compare planned time with actual time.',
      'Rank a fictional backlog and explain what you will defer.',
      'Design a weekly workflow with buffers, review points and limits on parallel work.',
    ],
  },
  {
    id: 'python',
    name: 'Python programming',
    category: 'Technology',
    topics: [
      'Variables and control flow',
      'Functions and data processing',
      'Reliable Python applications',
    ],
    concepts: [
      'Variables refer to values. Conditionals and loops control which instructions execute.',
      'Small functions with clear inputs and outputs are easier to test and reuse.',
      'Reliable programs validate inputs, handle expected failures and use tests to protect behavior.',
    ],
    practice: [
      'Write a small program that summarizes a list of practice scores.',
      'Turn a CSV-cleaning task into small reusable functions using synthetic data.',
      'Build a tested command-line data processor with clear errors and documented edge cases.',
    ],
  },
];
const levels: LearningLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
export const learningCourses = tracks.flatMap((track) =>
  levels.map((level, i) => ({
    id: `${track.id}-${level.toLowerCase()}`,
    skillId: track.id,
    skillName: track.name,
    category: track.category,
    level,
    title: track.topics[i],
    summary: track.concepts[i],
    prerequisite: i
      ? `${levels[i - 1]} ${track.name} or equivalent experience`
      : 'No prior experience needed',
    minutes: [30, 60, 90][i],
    lessons: [
      {
        title: 'Understand the idea',
        explanation: track.concepts[i],
        exercise: `Explain ${track.topics[i].toLowerCase()} in your own words. Name one example and one limitation.`,
      },
      {
        title: 'Practice deliberately',
        explanation:
          'Use the exercise below to produce a small, reviewable piece of work. Keep notes on decisions and anything you found difficult.',
        exercise: track.practice[i],
      },
      {
        title: 'Reflect and collect evidence',
        explanation:
          'A self-guided exercise is practice, not verification. Ask a peer for specific feedback and keep your draft and revisions. Use the separate foundation assessment to check your understanding, then collect practical evidence.',
        exercise:
          'Write three things you learned, one thing to improve, and a link or description of your practice artifact. No score, proof or credits are awarded by opening this guide.',
      },
    ],
  })),
);
const fail = (status: number, message: string) => Object.assign(Error(message), { status });
export function learningRouter(store: Store, options: { demo: boolean; payment: string }) {
  const router = Router();
  const sandbox = options.demo && options.payment === 'sandbox';
  const premium = (u: UserState) => sandbox && u.learningPremium?.source === 'sandbox';
  const lookup = (id: unknown, u: UserState) => {
    const c = learningCourses.find((c) => c.id === id);
    if (!c) throw fail(404, 'Learning guide not found');
    if (c.level === 'Advanced' && !premium(u))
      throw fail(403, 'Premium is required for advanced learning guides');
    return c;
  };
  router.get('/', (_req, res) => {
    const u = res.locals.user as UserState;
    res.json({
      premium: !!premium(u),
      sandboxAvailable: sandbox,
      courses: learningCourses.map(({ lessons, ...c }) => ({
        ...c,
        locked: c.level === 'Advanced' && !premium(u),
      })),
    });
  });
  router.post('/premium/demo-unlock', async (req, res) => {
    if (!sandbox)
      throw fail(
        403,
        'Demo premium is unavailable in this environment. Real subscription billing is not implemented.',
      );
    z.object({ confirm: z.literal(true) }).parse(req.body);
    await store.mutate(res.locals.user.id, (u) => {
      u.learningPremium ??= { source: 'sandbox', activatedAt: new Date().toISOString() };
    });
    res.json({
      premium: true,
      mode: 'sandbox',
      message: 'Premium preview unlocked. No payment was charged.',
    });
  });
  router.get('/:id', (req, res) => {
    res.json({ ...lookup(req.params.id, res.locals.user), locked: false });
  });
  router.post('/:id/start', async (req, res) => {
    const c = lookup(req.params.id, res.locals.user);
    await store.mutate(res.locals.user.id, (u) => {
      lookup(req.params.id, u);
      if (!u.skills.some((s) => s.id === c.skillId))
        u.skills.push({
          id: c.skillId,
          name: c.skillName,
          score: 0,
          confidence: 0,
          evidence: [],
          related: [],
        });
    });
    res.json({
      skillId: c.skillId,
      message: 'Skill added to your profile. Practice does not award a verified score.',
    });
  });
  return router;
}
