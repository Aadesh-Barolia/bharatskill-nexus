import { useRef, useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  X,
  Users,
  Compass,
  Code2,
  Trophy,
  Search,
} from 'lucide-react';
import { useLandingMotion } from './Motion';
import OtpForm from './OtpForm';
type Props = {
  signedIn: boolean;
  demoAvailable: boolean;
  onContinue: () => void;
  onExplore: (skillId: string) => void;
  onEnter: () => void;
  busy: boolean;
  error: string;
  onAuthenticated: () => Promise<void>;
};
const paths = [
  {
    id: 'react',
    name: 'Web development',
    category: 'Development',
    color: 'yellow',
    icon: '</>',
    description:
      'Connect your React, JavaScript and Node.js skills to a software engineering role.',
    skills: 'React · JavaScript · Node.js',
    label: 'Career direction',
  },
  {
    id: 'docker',
    name: 'Containers & delivery',
    category: 'Infrastructure',
    color: 'blue',
    icon: '{ }',
    description: 'Close your Docker and CI/CD gaps with peer practice and a knowledge challenge.',
    skills: 'Docker · CI/CD · Git',
    label: 'Skill direction',
  },
  {
    id: 'testing',
    name: 'Software testing',
    category: 'Development',
    color: 'pink',
    icon: '✓',
    description:
      'Learn to test your work, explain your decisions and collect evidence of progress.',
    skills: 'Testing · Debugging',
    label: 'Skill direction',
  },
];
export default function Landing({
  onEnter,
  onExplore,
  busy,
  error,
  onAuthenticated,
  signedIn,
  demoAvailable,
  onContinue,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  const [login, setLogin] = useState(false),
    [register, setRegister] = useState(false);
  const [filter, setFilter] = useState('All paths'),
    [search, setSearch] = useState('');
  useEffect(() => {
    if (!login) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLogin(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [login]);
  const explore = (id?: string) => {
    if (signedIn || demoAvailable) {
      if (id) onExplore(id);
      else if (signedIn) onContinue();
      else onEnter();
    } else {
      setRegister(true);
      setLogin(true);
    }
  };
  const visible = paths.filter(
    (p) =>
      (filter === 'All paths' || p.category === filter) &&
      `${p.name} ${p.skills}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="learn-site" ref={root}>
      <header className="learn-nav">
        <a href="#top" className="learn-brand">
          <span>[bN]</span> BharatSkill<span className="brand-sub">NEXUS</span>
        </a>
        <nav aria-label="Main">
          <a href="#paths">Explore paths</a>
          <a href="#how">How it works</a>
          <a href="#community">Community</a>
        </nav>
        <button
          className="learn-signin"
          onClick={() => {
            if (signedIn) onContinue();
            else {
              setRegister(false);
              setLogin(true);
            }
          }}
        >
          {signedIn ? 'My workspace' : 'Log in'}
        </button>
        <button
          className="primary"
          onClick={() => {
            setRegister(true);
            setLogin(true);
          }}
        >
          Sign up <ArrowRight size={16} />
        </button>
      </header>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <main>
        <section id="top" className="learn-hero">
          <div className="learn-hero-copy">
            <span className="learn-kicker">
              <span /> SMALL STEPS. REAL SKILLS.
            </span>
            <h1>
              Learn a skill.
              <br />
              Build your <span>next chapter.</span>
            </h1>
            <p>
              A clearer path from “I’m learning” to “I’m ready.” Discover your skill gaps, practice
              with peers, and turn what you learn into evidence.
            </p>
            <div className="learn-actions">
              <button
                className="primary"
                onClick={() => {
                  setRegister(true);
                  setLogin(true);
                }}
              >
                Start learning <ArrowRight size={18} />
              </button>
              <button className="text-button" disabled={busy} onClick={() => explore()}>
                {signedIn
                  ? 'Go to workspace'
                  : demoAvailable
                    ? 'Explore the demo'
                    : 'Join the public preview'}{' '}
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="hero-footnote">
              <Check size={16} /> New accounts start with your own progress.
            </div>
          </div>
          <div
            className="learning-illustration"
            role="img"
            aria-label="Illustrated learning plan: learn, practice, and prove your skills"
          >
            <svg className="doodle-sun" viewBox="0 0 100 100" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="50" cy="50" r="22" />
                <path d="M50 5v12m0 66v12M5 50h12m66 0h12M18 18l10 10m44 44l10 10M18 82l10-10m44-44l10-10" />
                <path d="M41 47v3m18-3v3m-19 9q10 10 20 0" />
              </g>
            </svg>
            <div className="illustration-dots" />
            <div className="lesson-paper">
              <div className="paper-toolbar">
                <span />
                <span />
                <span />
                <small>YOUR LEARNING PLAN</small>
              </div>
              <div className="paper-content">
                <span className="mini-label">NEXT UP / SKILL PRACTICE</span>
                <h2>
                  Make it. Break it.
                  <br />
                  Understand it.
                </h2>
                <div className="code-doodle">
                  <span>01</span> learn(<b>"Docker"</b>);
                  <br />
                  <span>02</span> practice.with(<b>"peers"</b>);
                  <br />
                  <span>03</span> progress.<b>prove</b>();
                </div>
                <div className="paper-check">
                  <Check size={17} /> One concept at a time
                </div>
              </div>
            </div>
            <div className="doodle-note">
              <Trophy size={26} />
              <span>
                Little wins.
                <br />
                <b>Lasting progress.</b>
              </span>
            </div>
            <svg className="doodle-arrow" viewBox="0 0 150 90" aria-hidden="true">
              <path
                d="M5 10Q110 0 95 48T140 69m-20-14 22 15-23 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </section>
        <div className="learn-value-strip">
          <span>
            <BookOpen /> Learn with a direction
          </span>
          <span>
            <Users /> Practice with people
          </span>
          <span>
            <Check /> Prove what you know
          </span>
          <span>
            <Compass /> See what comes next
          </span>
        </div>
        <section className="learn-section broader-skills">
          <span className="learn-kicker">BEYOND TECHNICAL SKILLS</span>
          <h2>Grow the whole skill set.</h2>
          <p>
            Public speaking, communication, problem solving, technical fundamentals, Git, network
            marketing, cybersecurity, data analysis, critical thinking, teamwork, time management
            and Python.
          </p>
          <div className="path-tabs">
            <span>Beginner · Free</span>
            <span>Intermediate · Free</span>
            <span>Advanced · Premium</span>
          </div>
          <button className="primary" disabled={busy} onClick={() => explore('catalog')}>
            Explore all 36 skill guides <ArrowRight size={17} />
          </button>
          <p className="chart-caption">
            Opens the demo library. Advanced content needs a separate premium preview unlock.
          </p>
        </section>
        <section className="learn-section" id="paths">
          <div className="section-intro">
            <div>
              <span className="learn-kicker">FIND YOUR STARTING POINT</span>
              <h2>What do you want to build?</h2>
              <p>Explore the learning directions available in the demo.</p>
            </div>
            <label className="path-search">
              <Search size={18} />
              <input
                aria-label="Search learning paths"
                placeholder="Search a skill or path"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="path-tabs" role="group" aria-label="Filter learning paths">
            {['All paths', 'Development', 'Infrastructure'].map((f) => (
              <button
                key={f}
                className={filter === f ? 'selected' : ''}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="learning-cards">
            {visible.map((p) => (
              <article className="learning-card" key={p.name}>
                <div className={'course-art ' + p.color}>
                  <span>{p.icon}</span>
                  <svg viewBox="0 0 180 80" aria-hidden="true">
                    <path
                      d="M0 60Q30 0 60 40T120 30T180 20M0 72Q30 12 60 52T120 42T180 32"
                      fill="none"
                      stroke="currentColor"
                    />
                  </svg>
                  <small>{p.label}</small>
                </div>
                <div className="course-content">
                  <span className="mini-label">GUIDED DEMO · PEER LEARNING</span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="course-skills">{p.skills}</div>
                  <button disabled={busy} onClick={() => explore(p.id)}>
                    {demoAvailable ? 'Explore in demo' : 'Explore this path'}{' '}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!visible.length && (
            <p role="status">No paths match that search. Try Docker, React or testing.</p>
          )}
        </section>
        <section id="how" className="learn-how">
          <div className="learn-section">
            <div className="section-intro">
              <div>
                <span className="learn-kicker">A PLAN, NOT A GUESS</span>
                <h2>Your goal. A practical way there.</h2>
                <p>Every part of Nexus connects learning to your next opportunity.</p>
              </div>
              <button className="secondary" onClick={() => explore()} disabled={busy}>
                Try the complete journey <ArrowRight size={16} />
              </button>
            </div>
            <div className="how-grid">
              <div className="progress-example">
                <span className="mini-label">EXAMPLE · SOFTWARE ENGINEERING INTERN</span>
                <div className="example-score">
                  <strong>
                    78<span>%</span>
                  </strong>
                  <p>
                    Opportunity readiness
                    <br />
                    <b>A starting point, not a verdict.</b>
                  </p>
                </div>
                <div className="example-bars">
                  {[
                    ['React', 82],
                    ['JavaScript', 88],
                    ['Testing', 20],
                    ['Docker', 0],
                  ].map(([n, v]) => (
                    <div key={n}>
                      <span>{n}</span>
                      <div>
                        <i style={{ width: `${v}%` }} />
                      </div>
                      <b>{v}%</b>
                    </div>
                  ))}
                </div>
                <p className="chart-caption">
                  Illustrative demo profile. Real accounts start at zero.
                </p>
              </div>
              <div className="learning-steps">
                {[
                  [
                    Compass,
                    '01',
                    'Know where you stand',
                    'Compare your skills with an opportunity. Readiness and gap analysis show what to work on.',
                  ],
                  [
                    Code2,
                    '02',
                    'Make a learning plan',
                    'Use the simulator to explore improvements. Skill GPS turns gaps into an ordered plan.',
                  ],
                  [
                    Users,
                    '03',
                    'Practice. Prove. Progress.',
                    'Meet a peer through NexusMatch, chat, complete a session and challenge, and earn SkillCredits.',
                  ],
                ].map(([Icon, n, title, desc]) => {
                  const I = Icon as typeof Compass;
                  return (
                    <article className="learning-step scroll-reveal" key={String(n)}>
                      <span className="step-icon">
                        <I size={22} />
                      </span>
                      <div>
                        <small>STEP {String(n)}</small>
                        <h3>{String(title)}</h3>
                        <p>{String(desc)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        <section id="community" className="learn-section community-block">
          <div
            className="community-art"
            role="img"
            aria-label="Doodle of two learners sharing ideas"
          >
            <svg viewBox="0 0 440 290">
              <rect x="15" y="35" width="410" height="230" rx="110" fill="#c9e8d9" />
              <g stroke="#14213d" strokeWidth="3">
                <path d="M50 250q0-100 80-100t80 100" fill="#f8ce53" />
                <circle cx="130" cy="107" r="43" fill="#fff5e5" />
                <path d="M87 102q-5-65 57-44l31 38-22-4-16-26-31 39" fill="#14213d" />
                <path d="M245 250q0-100 75-100t75 100" fill="#94a7ed" />
                <circle cx="320" cy="110" r="41" fill="#fff5e5" />
                <path d="M280 110q-13-70 45-53t35 54l-20-34-22 23-32-8" fill="#14213d" />
                <path
                  d="M116 108v4m22-4v4m-22 14q12 10 23-2m88-17v4m20-4v4m-21 14q12 10 22-2"
                  fill="none"
                />
                <rect x="144" y="194" width="143" height="72" rx="3" fill="#fffdf6" />
                <path d="m210 218-12 9 12 9m15-18 12 9-12 9" fill="none" />
                <path d="M191 28h65v54h-22l-19 17V82h-24z" fill="#fffdf6" />
                <path d="M205 48h34m-34 13h21" />
              </g>
            </svg>
          </div>
          <div>
            <span className="learn-kicker">BETTER TOGETHER</span>
            <h2>
              Stuck is a place.
              <br />
              Not a personality.
            </h2>
            <p>
              Find someone who can explain it differently. NexusMatch connects skill gaps to peer
              strengths, and built-in chat gives you a place to work through them.
            </p>
            <button className="primary" onClick={() => explore()} disabled={busy}>
              Explore peer learning <ArrowRight size={17} />
            </button>
            <small className="community-note">
              Demo recommendations are sample profiles. Invite a real peer to chat.
            </small>
          </div>
        </section>
        <section className="learn-final">
          <div>
            <span className="learn-kicker">YOUR NEXT STEP STARTS HERE</span>
            <h2>Give your curiosity a direction.</h2>
            <p>Explore the full demo, or create an account with a clean slate.</p>
          </div>
          <button
            className="primary"
            onClick={() => {
              setRegister(true);
              setLogin(true);
            }}
          >
            Create your account <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer className="learn-footer">
        <a href="#top" className="learn-brand">
          <span>[bN]</span> BharatSkill Nexus
        </a>
        <p>Learn. Practice. Prove. Progress.</p>
        <small>© 2026 BharatSkill Nexus · Hackathon preview</small>
      </footer>
      {login && (
        <div className="modal-backdrop" onClick={() => setLogin(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              onClick={() => setLogin(false)}
              aria-label="Close sign in"
            >
              <X />
            </button>
            <span className="wordmark-flower">✳</span>
            <h2 id="login-title">{register ? 'Start your own Nexus.' : 'Hey, welcome back.'}</h2>
            <p>
              {register
                ? 'Your next chapter starts here.'
                : 'Your people and possibilities are waiting.'}
            </p>
            <OtpForm
              key={register ? 'signup' : 'login'}
              register={register}
              onAuthenticated={onAuthenticated}
            />
            <button className="text-button" onClick={() => setRegister(!register)}>
              {register ? 'Already here? Sign in' : 'New around here? Create an account'}
            </button>
            <button className="secondary full" disabled={busy} onClick={() => explore()}>
              {signedIn
                ? 'Return to workspace'
                : demoAvailable
                  ? 'Try the demo'
                  : 'Create an account to explore'}
              <ArrowUpRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
