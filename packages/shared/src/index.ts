export type Skill = {
  id: string;
  name: string;
  score: number;
  confidence: number;
  evidence: string[];
  related: string[];
};
export type Requirement = { skillId: string; target: number; weight: number };
export type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: Requirement[];
  tags: string[];
  demo: boolean;
};
export type Factors = {
  skillMatch: number;
  evidence: number;
  experience: number;
  projects: number;
  activity: number;
};
export type Readiness = {
  score: number;
  version: string;
  factors: Factors;
  contributions: Factors;
  explanation: string;
};
export type Gap = {
  skillId: string;
  name: string;
  current: number;
  target: number;
  severity: 'missing' | 'weak';
  impact: number;
};
export type Peer = {
  id: string;
  name: string;
  initials: string;
  campus: string;
  skills: Record<string, number>;
  teaching: number;
  availability: number;
  reliability: number;
  languages: string[];
  wants: string[];
  activeLearners: number;
  completed: number;
  color: string;
};
export type Match = Peer & {
  match: number;
  reasons: string[];
  breakdown: Record<string, number>;
  swap: string | null;
};
export type Session = {
  id: string;
  peerId: string;
  skillId: string;
  status: 'booked' | 'completed';
  createdAt: string;
  completedAt?: string;
};
export type Evidence = {
  id: string;
  skillId: string;
  type: string;
  title: string;
  verified: boolean;
  createdAt: string;
};
export type LedgerEntry = {
  id: string;
  amount: number;
  reason: string;
  reference: string;
  createdAt: string;
};
export type Snapshot = { score: number; at: string; reason: string };
export type Payment = {
  id: string;
  mode: 'sandbox' | 'testnet';
  status: 'required' | 'settled';
  createdAt: string;
  expiresAt: string;
  transaction?: string;
  opportunityId: string;
};
export type UserState = {
  assessments?: AssessmentAttempt[];
  learningPremium?: { source: 'sandbox'; activatedAt: string } | null;
  conversations?: Conversation[];
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  campus: string;
  languages: string[];
  skills: Skill[];
  factors: Omit<Factors, 'skillMatch'>;
  sessions: Session[];
  evidence: Evidence[];
  ledger: LedgerEntry[];
  snapshots: Snapshot[];
  payments: Payment[];
  completedChallenges: string[];
  revision: number;
};
export type RoadmapStep = {
  skillId: string;
  title: string;
  days: number;
  outcome: string;
  status: 'complete' | 'next' | 'upcoming';
  peerId?: string;
  projectedReadiness: number;
};
export type Roadmap = {
  target: number;
  projected: number;
  days: number;
  peerDays: number;
  steps: RoadmapStep[];
};
export type Question = { id: string; prompt: string; options: string[] };
export type Challenge = {
  id: string;
  skillId: string;
  title: string;
  brief: string;
  questions: Question[];
  reward: number;
};
export type Dashboard = {
  isAdmin?: boolean;
  user: Omit<UserState, 'passwordHash'>;
  opportunity: Opportunity;
  opportunities: Opportunity[];
  readiness: Readiness;
  gaps: Gap[];
  roadmap: Roadmap;
  peers: Match[];
  balance: number;
  mode: { storage: string; payment: string; demo: boolean };
  challenges: Challenge[];
};

export type ChatMessage = {
  id: string;
  clientId: string;
  senderId: string;
  text: string;
  sentAt: string;
};
export type Conversation = {
  id: string;
  ownerId: string;
  peerId: string;
  title: string;
  members: { id: string; name: string }[];
  messages: ChatMessage[];
  inviteHash: string;
  createdAt: string;
  updatedAt: string;
};
export type ChatRoom = Omit<Conversation, 'inviteHash'>;

export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type LearningCourse = {
  id: string;
  skillId: string;
  skillName: string;
  title: string;
  category: string;
  level: LearningLevel;
  summary: string;
  prerequisite: string;
  minutes: number;
  locked: boolean;
};
export type LearningLesson = { title: string; explanation: string; exercise: string };
export type LearningCatalog = {
  courses: LearningCourse[];
  premium: boolean;
  sandboxAvailable: boolean;
};
export type LearningDetail = LearningCourse & { lessons: LearningLesson[] };

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  campus: string;
  demo: boolean;
  skills: number;
  proofs: number;
  sessions: number;
  credits: number;
  challenges: number;
  premiumPreview: boolean;
  sandboxSettled: number;
};
export type AdminOverview = {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  summary: { registered: number; demos: number; premiumPreviews: number; sandboxSettled: number };
  revenue: { amount: null; explanation: string };
};

export type AssessmentAttempt = {
  id: string;
  skillId: string;
  version: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  answers?: number[];
  score?: number;
  profileBefore?: number;
  profileAfter?: number;
};
export type AssessmentSummary = {
  skillId: string;
  name: string;
  category: string;
  questions: number;
  latest: AssessmentAttempt | null;
};
export type AssessmentQuiz = {
  attempt: AssessmentAttempt;
  name: string;
  questions: (Question & { topic: string })[];
};
export type AssessmentResult = {
  attempt: AssessmentAttempt;
  name: string;
  band: string;
  review: (Question & {
    topic: string;
    answer: number;
    selected: number;
    explanation: string;
    correct: boolean;
  })[];
  nextSteps: { topic: string; exercise: string }[];
  courseId: string;
  readiness: number;
};
