import type { Challenge, Opportunity, Peer, UserState } from '@nexus/shared';
export const opportunities: Opportunity[] = [
  {
    id: 'swe-intern',
    title: 'Software Engineering Intern',
    company: 'Nexus Labs',
    location: 'Bengaluru · Hybrid',
    type: 'Internship',
    demo: true,
    description:
      'Build thoughtful web products with React and Node.js. Ship tested, containerized services through a reliable delivery pipeline. A curated demo opportunity.',
    tags: ['React', 'Node.js', 'Product engineering'],
    requirements: [
      { skillId: 'react', target: 80, weight: 25 },
      { skillId: 'javascript', target: 80, weight: 20 },
      { skillId: 'node', target: 75, weight: 15 },
      { skillId: 'git', target: 70, weight: 5 },
      { skillId: 'docker', target: 60, weight: 12 },
      { skillId: 'testing', target: 60, weight: 9 },
      { skillId: 'cicd', target: 60, weight: 14 },
    ],
  },
  {
    id: 'frontend-fellow',
    title: 'Frontend Engineering Fellow',
    company: 'Campus Collective',
    location: 'Remote · India',
    type: 'Fellowship',
    demo: true,
    description:
      'Create accessible interfaces and test reusable components with a student product team.',
    tags: ['React', 'JavaScript', 'Testing'],
    requirements: [
      { skillId: 'react', target: 85, weight: 40 },
      { skillId: 'javascript', target: 85, weight: 35 },
      { skillId: 'testing', target: 60, weight: 25 },
    ],
  },
  {
    id: 'build-for-bharat',
    title: 'Build for Bharat Challenge',
    company: 'Campus Collective',
    location: 'ABES · Ghaziabad',
    type: 'Hackathon',
    demo: true,
    description:
      'Prototype a useful campus service with peers. Demonstrate a working full-stack project.',
    tags: ['Team project', 'Node.js', 'Git'],
    requirements: [
      { skillId: 'react', target: 70, weight: 35 },
      { skillId: 'node', target: 70, weight: 35 },
      { skillId: 'git', target: 60, weight: 30 },
    ],
  },
];
export const peers: Peer[] = [
  {
    id: 'harshit',
    name: 'Harshit Sharma',
    initials: 'HS',
    campus: 'ABES Engineering College',
    skills: { docker: 91, testing: 72, cicd: 80, react: 43 },
    teaching: 94,
    availability: 100,
    reliability: 96,
    languages: ['Hindi', 'English'],
    wants: ['react'],
    activeLearners: 1,
    completed: 24,
    color: '#d6bd98',
  },
  {
    id: 'mouli',
    name: 'Mouli Saxena',
    initials: 'MS',
    campus: 'ABES Engineering College',
    skills: { docker: 68, testing: 94, cicd: 72, react: 65 },
    teaching: 96,
    availability: 90,
    reliability: 98,
    languages: ['Hindi', 'English'],
    wants: ['node'],
    activeLearners: 2,
    completed: 31,
    color: '#c3bfdf',
  },
  {
    id: 'aastha',
    name: 'Aastha Jain',
    initials: 'AJ',
    campus: 'ABES Engineering College',
    skills: { docker: 85, testing: 78, cicd: 96, react: 58 },
    teaching: 90,
    availability: 85,
    reliability: 95,
    languages: ['English'],
    wants: ['react'],
    activeLearners: 1,
    completed: 19,
    color: '#b3c9b8',
  },
  {
    id: 'abhishek',
    name: 'Abhishek Singh',
    initials: 'AS',
    campus: 'ABES Engineering College',
    skills: { docker: 97, testing: 90, cicd: 93, react: 90 },
    teaching: 68,
    availability: 45,
    reliability: 80,
    languages: ['Hindi', 'English'],
    wants: ['design'],
    activeLearners: 7,
    completed: 12,
    color: '#d5b5ad',
  },
];
export const challenges: Challenge[] = [
  {
    id: 'docker-foundations',
    skillId: 'docker',
    title: 'Containerize your first service',
    brief:
      'A short knowledge check after your peer session. Pass all three questions to earn foundational evidence. This is a demo assessment, not a production code review.',
    reward: 30,
    questions: [
      {
        id: 'd1',
        prompt: 'Which file defines how a Docker image is built?',
        options: ['package.json', 'Dockerfile', 'docker.log'],
      },
      {
        id: 'd2',
        prompt: 'Which command builds an image from the current directory?',
        options: ['docker start .', 'docker build -t nexus .', 'docker push .'],
      },
      {
        id: 'd3',
        prompt: 'How do you publish container port 3000 on host port 8080?',
        options: ['-p 8080:3000', '-p 3000:8080', '--port 8080'],
      },
    ],
  },
  {
    id: 'testing-foundations',
    skillId: 'testing',
    title: 'Make a test worth trusting',
    brief: 'Verify the testing concepts from your peer session. All three answers must be correct.',
    reward: 30,
    questions: [
      {
        id: 't1',
        prompt: 'What should a useful unit test assert?',
        options: ['The implementation line count', 'Observable behavior', 'The variable names'],
      },
      {
        id: 't2',
        prompt: 'Which case belongs in an API validation test?',
        options: ['Only valid inputs', 'Only the homepage', 'Invalid and boundary inputs'],
      },
      {
        id: 't3',
        prompt: 'What makes a test deterministic?',
        options: ['Random network data', 'Controlled inputs and dependencies', 'Running only once'],
      },
    ],
  },
  {
    id: 'cicd-foundations',
    skillId: 'cicd',
    title: 'Ship through a reliable pipeline',
    brief:
      'Verify the delivery concepts from your peer session. All three answers must be correct.',
    reward: 30,
    questions: [
      {
        id: 'c1',
        prompt: 'When should your CI pipeline run tests?',
        options: ['Before merging a pull request', 'Only after a user reports an error', 'Never'],
      },
      {
        id: 'c2',
        prompt: 'Where should deployment secrets be stored?',
        options: ['In a public repository', 'In browser JavaScript', 'In protected CI secrets'],
      },
      {
        id: 'c3',
        prompt: 'What should happen if required checks fail?',
        options: ['Deploy anyway', 'Block the deployment', 'Delete the tests'],
      },
    ],
  },
];
// Answer keys never leave the server.
export const answerKeys: Record<string, number[]> = {
  'docker-foundations': [1, 1, 0],
  'testing-foundations': [1, 2, 1],
  'cicd-foundations': [0, 2, 1],
};
export function seedUser(
  id: string,
  name = 'Aadesh Barolia',
  email = `${id}@demo.nexus.local`,
): UserState {
  const now = new Date().toISOString();
  return {
    id,
    name,
    email,
    campus: 'ABES Engineering College',
    languages: ['Hindi', 'English'],
    revision: 0,
    assessments: [],
    skills: [
      ['react', 'React', 82, ['javascript', 'node']],
      ['javascript', 'JavaScript', 88, ['react', 'git']],
      ['node', 'Node.js', 78, ['docker', 'javascript']],
      ['git', 'Git', 85, ['cicd']],
      ['docker', 'Docker', 0, ['node', 'cicd']],
      ['testing', 'Testing', 20, ['react']],
      ['cicd', 'CI/CD', 0, ['git', 'docker']],
    ].map(([id, name, score, related]) => ({
      id: id as string,
      name: name as string,
      score: score as number,
      related: related as string[],
      confidence: (score as number) > 60 ? 0.9 : 0.2,
      evidence: (score as number) > 60 ? ['Campus project', 'Peer review'] : [],
    })),
    factors: { evidence: 85, experience: 80, projects: 90, activity: 82 },
    sessions: [],
    evidence: [],
    ledger: [
      {
        id: 'welcome',
        amount: 120,
        reason: 'Campus contributor · opening balance',
        reference: 'seed',
        createdAt: now,
      },
    ],
    snapshots: [{ score: 78, at: now, reason: 'Starting readiness · SWE internship' }],
    payments: [],
    completedChallenges: [],
  };
}
