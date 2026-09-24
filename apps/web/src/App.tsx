import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Activity,
  Network,
  Compass,
  Users,
  Briefcase,
  Coins,
  ChevronRight,
  Check,
  Plus,
  Minus,
  MapPin,
  Clock,
  ArrowLeft,
  LogOut,
  RotateCcw,
  X,
  Sparkles,
  ShieldCheck,
  Menu,
  BookOpen,
  Target,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import type { Dashboard, Match, Payment } from '@nexus/shared';
import { api, post, ApiError } from './api';
import Landing from './Landing';
import Chat from './Chat';
import Assistant from './Assistant';
import { CreditGuide, GapSteps } from './LearningSupport';
import SkillChart from './SkillChart';
import SkillLibrary from './SkillLibrary';
import Admin from './Admin';
import Assessments from './Assessments';
type Page =
  | 'Assessments'
  | 'Skill library'
  | 'Assistant'
  | 'Overview'
  | 'Opportunities'
  | 'Skill GPS'
  | 'NexusMatch'
  | 'My sessions'
  | 'SkillCredits'
  | 'Intelligence'
  | 'Messages'
  | 'Admin';
const navigation = [
  { name: 'Overview', icon: Network },
  { name: 'Skill library', icon: BookOpen },
  { name: 'Assessments', icon: Target },
  { name: 'Opportunities', icon: Briefcase },
  { name: 'Skill GPS', icon: Compass },
  { name: 'NexusMatch', icon: Users },
  { name: 'My sessions', icon: BookOpen },
  { name: 'SkillCredits', icon: Coins },
  { name: 'Messages', icon: MessageCircle },
  { name: 'Assistant', icon: Sparkles },
] as const;
const names: Record<string, string> = {
  docker: 'Docker',
  testing: 'Testing',
  cicd: 'CI/CD',
  react: 'React',
  javascript: 'JavaScript',
  node: 'Node.js',
  git: 'Git',
};
function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">[bN]</span>
      <span>
        bharatskill<span className="brand-sub">NEXUS</span>
      </span>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}
function App() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [checking, setChecking] = useState(true);
  const [home, setHome] = useState(
    !['/app', '/admin', '/assessments'].includes(location.pathname) &&
      !new URLSearchParams(location.hash.slice(1)).has('chat'),
  );
  const [demoAvailable, setDemoAvailable] = useState(false);
  useEffect(() => {
    api<{ demo: boolean }>('/health')
      .then((s) => setDemoAvailable(s.demo))
      .catch(() => {});
    const pop = () => {
      setPage(location.pathname === '/admin' ? 'Admin' : location.pathname === '/assessments' ? 'Assessments' : 'Overview');
      setHome(
        !['/app', '/admin', '/assessments'].includes(location.pathname) &&
          !new URLSearchParams(location.hash.slice(1)).has('chat'),
      );
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  const visitHome = () => {
    history.pushState({}, '', '/');
    setHome(true);
    setMenu(false);
    window.dispatchEvent(new Event('nexus:navigate'));
  };
  const [page, setPage] = useState<Page>(
    location.pathname === '/assessments' ? 'Assessments' : location.pathname === '/admin'
      ? 'Admin'
      : new URLSearchParams(location.hash.slice(1)).has('chat')
        ? 'Messages'
        : 'Overview',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [opportunityId, setOpportunityId] = useState('swe-intern');
  const [skillId, setSkillId] = useState('docker');
  const [menu, setMenu] = useState(false);
  const [assessmentSkill, setAssessmentSkill] = useState('');
  const [practiceCourse, setPracticeCourse] = useState('');
  const [chatPeer, setChatPeer] = useState<string | null>(null);
  const load = useCallback(async () => {
    const next = await api<Dashboard>(
      `/dashboard?opportunityId=${opportunityId}&skillId=${skillId}`,
    );
    setData(next);
  }, [opportunityId, skillId]);
  useEffect(() => {
    let active = true;
    api<Dashboard>(`/dashboard?opportunityId=${opportunityId}&skillId=${skillId}`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active && !(e instanceof ApiError && e.status === 401)) setError(e.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [opportunityId, skillId]);
  async function act(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const go = (p: Page) => {
    setPage(p);
    setHome(false);
    if (location.pathname !== (p === 'Admin' ? '/admin' : p === 'Assessments' ? '/assessments' : '/app'))
      history.pushState(
        {},
        '',
        (p === 'Admin' ? '/admin' : p === 'Assessments' ? '/assessments' : '/app') +
          (new URLSearchParams(location.hash.slice(1)).has('chat') ? location.hash : ''),
      );
    setMenu(false);
    setError('');
    window.dispatchEvent(new Event('nexus:navigate'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const enter = (pathSkill?: string) =>
    act(async () => {
      if (!data) await post('/auth/demo');
      await load();
      if (pathSkill === 'catalog') go('Skill library');
      else if (pathSkill) {
        setSkillId(pathSkill);
        go(pathSkill === 'react' ? 'Opportunities' : 'Skill GPS');
      } else go(page === 'Assessments' ? 'Assessments' : 'Overview');
    });
  const book = (peer: Match) =>
    act(async () => {
      await post('/sessions', { peerId: peer.id, skillId });
      await load();
      go('My sessions');
      setNotice(`Your ${names[skillId]} session with ${peer.name.split(' ')[0]} is ready.`);
    });
  if (checking && !home)
    return (
      <div className="boot">
        <Brand />
        <span>
          CONNECTING YOUR NEXUS<span className="loading-dots">...</span>
        </span>
      </div>
    );
  if (home || !data)
    return (
      <Landing
        signedIn={!!data}
        demoAvailable={demoAvailable}
        onContinue={() => go(page)}
        onEnter={() => void enter()}
        onExplore={(id) => void enter(id)}
        busy={busy}
        error={error}
        onAuthenticated={async () => {
          await load();
          go(page);
        }}
      />
    );
  const score = data.readiness.score;
  const baseline = data.user.snapshots[0]?.score ?? score;
  const improved = score - baseline;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <button className="home-brand" aria-label="Back to home page" onClick={visitHome}>
          <Brand />
        </button>
        <span className="nav-caption">YOUR WORKSPACE</span>
        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => go(name)}
              className={page === name ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={18} />
              {name}
              {name === 'NexusMatch' && <span className="nav-dot" />}
            </button>
          ))}
          {data.isAdmin && (
            <button
              className={page === 'Admin' ? 'nav-item active' : 'nav-item'}
              onClick={() => go('Admin')}
            >
              <ShieldCheck size={18} />
              Admin
            </button>
          )}
        </nav>
        <button
          className={`nav-item intelligence-link ${page === 'Intelligence' ? 'active' : ''}`}
          onClick={() => go('Intelligence')}
        >
          <Sparkles size={18} />
          Nexus Intelligence
          <ArrowUpRight size={14} />
        </button>
        <div className="sidebar-bottom">
          <div className="campus-note">
            <span className="status-dot" />
            THE CAMPUS EDITION
            <p>
              Built for the way
              <br />
              we grow together.
            </p>
            <span>ABES · GHAZIABAD</span>
          </div>
          <button
            className="profile"
            onClick={() =>
              act(async () => {
                await post('/auth/logout');
                setData(null);
                visitHome();
              })
            }
          >
            <span className="avatar small">
              {data.user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              {data.user.name}
              <small>
                {data.user.email.endsWith('@demo.nexus.local')
                  ? 'Demo student · sign out'
                  : 'Student · sign out'}
              </small>
            </span>
            <LogOut size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={21} />
          </button>
          <span className="breadcrumb">
            Your workspace <ChevronRight size={13} />
            <strong>{page}</strong>
          </span>
          <div className="topbar-right">
            <span className="connection">
              <span className="status-dot" />
              NEXUS ONLINE
            </span>
            <button className="credits-pill" onClick={() => go('SkillCredits')}>
              <Coins size={15} />
              {data.balance}
              <span>credits</span>
            </button>
            <span className="avatar tiny">{data.user.name[0]}</span>
          </div>
        </header>
        <main className="main-content">
          <div className="demo-strip">
            <span>
              <span className="status-dot" />
              {data.mode.demo
                ? 'HACKATHON DEMO'
                : 'PUBLIC PREVIEW · EXAMPLE OPPORTUNITIES & PEERS'}{' '}
              <span className="strip-separator">/</span> Learn. Prove. Move forward.
            </span>
            {data.mode.demo && (
              <button
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await post('/demo/reset');
                    await load();
                    setNotice('Demo reset to 78% readiness.');
                  })
                }
              >
                <RotateCcw size={12} />
                Reset demo
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="alert error">
              {error}
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="alert success">
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          )}
          {page === 'Admin' &&
            (data.isAdmin ? (
              <Admin />
            ) : (
              <div className="alert error" role="alert">
                This page is private. Sign in with the owner email using a code delivered to your
                inbox.
              </div>
            ))}
          {page === 'Overview' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR LEARNING DASHBOARD</span>
                  <h1>
                    Welcome back, {data.user.name.split(' ')[0]}
                    <span className="accent">.</span>
                  </h1>
                  <p>Choose a goal, practice a skill, and track what you can do.</p>
                </div>
                <button className="secondary" onClick={() => go('Opportunities')}>
                  Explore opportunities
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="overview-grid">
                <section className="panel graph-panel">
                  <div className="panel-header">
                    <div>
                      <span className="eyebrow">YOUR SKILLS AT A GLANCE</span>
                      <h2>Build on what you know</h2>
                    </div>
                    <Tag>
                      <span className="status-dot" />
                      SKILL PROGRESS
                    </Tag>
                  </div>
                  <div className="skill-scene">
                    <SkillChart
                      skills={data.user.skills}
                      selected={skillId}
                      onSelect={setSkillId}
                    />
                  </div>
                  <div className="graph-footer">
                    <div>
                      <strong>
                        {data.user.skills
                          .filter((s) => s.score >= 60)
                          .length.toString()
                          .padStart(2, '0')}
                      </strong>
                      <span>established skills</span>
                    </div>
                    <div>
                      <strong>{data.gaps.length.toString().padStart(2, '0')}</strong>
                      <span>opportunity gaps</span>
                    </div>
                    <button onClick={() => go('Opportunities')}>
                      View skill gaps
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </section>
                <section className="panel readiness-panel">
                  <span className="eyebrow">YOUR NEXT DESTINATION</span>
                  <div className="company-line">
                    <span className="company-icon">n.</span>
                    <div>
                      <h3>{data.opportunity.company}</h3>
                      <p>{data.opportunity.title}</p>
                    </div>
                    <ArrowUpRight size={18} />
                  </div>
                  <div className="score-display">
                    <div
                      className="score-ring"
                      style={{ '--score': `${score}%` } as React.CSSProperties}
                    >
                      <span>
                        {score}
                        <small>%</small>
                      </span>
                    </div>
                    <span className="eyebrow">OPPORTUNITY READINESS</span>
                    {improved > 0 ? (
                      <span className="growth">+{improved} points from your learning</span>
                    ) : (
                      <span className="muted">You’re closer than you think.</span>
                    )}
                  </div>
                  <div className="readiness-message">
                    <span className="status-dot" />
                    {data.gaps.length
                      ? `${data.gaps.length} skills between you and your next step`
                      : 'You reached your readiness destination'}
                  </div>
                  <button className="primary full" onClick={() => go('Opportunities')}>
                    Make me ready
                    <ArrowRight size={16} />
                  </button>
                  <small className="footnote">
                    Based on your skills and evidence. Always explainable.
                  </small>
                </section>
              </div>
              <div className="section-heading">
                <h2>A clear path forward</h2>
                <span>SMALL STEPS. REAL MOMENTUM.</span>
              </div>
              <div className="action-grid">
                <button className="action-card" onClick={() => go('Skill GPS')}>
                  <span className="feature-icon">
                    <Compass size={22} />
                  </span>
                  <span className="card-index">01</span>
                  <h3>Your personal Skill GPS</h3>
                  <p>
                    {data.roadmap.days
                      ? `${data.roadmap.days} days. ${data.gaps.length} focused skills. One way forward.`
                      : 'Your learning route is complete. Explore your next goal.'}
                  </p>
                  <span className="card-link">
                    Build my path
                    <ArrowUpRight size={16} />
                  </span>
                </button>
                <button className="action-card" onClick={() => go('NexusMatch')}>
                  <span className="feature-icon">
                    <Users size={22} />
                  </span>
                  <span className="card-index">02</span>
                  <h3>Good people. Shared growth.</h3>
                  <p>Find a peer who gets where you are, and where you’re going.</p>
                  <span className="card-link">
                    Meet your NexusMatch
                    <ArrowUpRight size={16} />
                  </span>
                </button>
                <button className="action-card" onClick={() => go('SkillCredits')}>
                  <span className="feature-icon">
                    <Activity size={22} />
                  </span>
                  <span className="card-index">03</span>
                  <h3>Every contribution counts</h3>
                  <p>Turn what you learn and share into visible, lasting progress.</p>
                  <span className="card-link">
                    See your impact
                    <ArrowUpRight size={16} />
                  </span>
                </button>
              </div>
              <div className="evidence-strip">
                <ShieldCheck size={19} />
                <div>
                  <strong>
                    {names[skillId]} · {data.user.skills.find((s) => s.id === skillId)?.score}/100
                  </strong>
                  <span>
                    {data.user.skills.find((s) => s.id === skillId)?.evidence.join(' · ') ||
                      'No verified evidence yet. A peer session is a good place to start.'}
                  </span>
                </div>
                <button className="text-button" onClick={() => go('NexusMatch')}>
                  Grow this skill
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
          {page === 'Opportunities' && (
            <>
              <PageHeading
                eyebrow="02 / CHOOSE YOUR DIRECTION"
                title="A possibility worth preparing for."
                subtitle="Discover the fit, understand the gaps, and try your next move."
              />
              <div className="opportunity-tabs">
                {data.opportunities.map((o) => (
                  <button
                    key={o.id}
                    className={o.id === opportunityId ? 'selected' : ''}
                    onClick={() => setOpportunityId(o.id)}
                  >
                    <span>{o.type}</span>
                    <strong>{o.title}</strong>
                    <small>{o.company}</small>
                  </button>
                ))}
              </div>
              <div className="two-column">
                <section className="panel content-panel">
                  <Tag>CURATED DEMO OPPORTUNITY</Tag>
                  <h2 className="large-title">{data.opportunity.title}</h2>
                  <p>{data.opportunity.description}</p>
                  <div className="inline-meta">
                    <MapPin size={15} />
                    {data.opportunity.location}
                  </div>
                  <div className="tag-row">
                    {data.opportunity.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                  <hr />
                  <div className="section-heading">
                    <h3>Your skill fit</h3>
                    <span>{score}% READY</span>
                  </div>
                  {data.opportunity.requirements.map((r) => {
                    const s = data.user.skills.find((s) => s.id === r.skillId)!;
                    return (
                      <div className="skill-row" key={s.id}>
                        <span
                          className={s.score >= r.target ? 'skill-status good' : 'skill-status'}
                        >
                          {s.score >= r.target ? <Check size={13} /> : <Minus size={13} />}
                        </span>
                        <strong>{s.name}</strong>
                        <span className="bar-track">
                          <i style={{ width: `${Math.min(100, (s.score / r.target) * 100)}%` }} />
                        </span>
                        <small>
                          {s.score} / {r.target}
                        </small>
                      </div>
                    );
                  })}
                  <details className="score-details">
                    <summary>How is my readiness calculated?</summary>
                    <p>{data.readiness.explanation}</p>
                    {Object.entries(data.readiness.contributions).map(([k, v]) => (
                      <div key={k}>
                        {k}
                        <span>{v.toFixed(1)} points</span>
                      </div>
                    ))}
                    <small>Score version: {data.readiness.version}</small>
                  </details>
                </section>
                <div>
                  <Simulator data={data} onError={setError} />
                  <section className="panel content-panel gap-list">
                    <span className="eyebrow">THE DISTANCE TO CLOSE</span>
                    {data.gaps.length ? (
                      data.gaps.map((g) => (
                        <div key={g.skillId}>
                          <div>
                            <h3>{g.name}</h3>
                            <span>
                              {g.severity === 'missing'
                                ? 'Missing foundation'
                                : 'Needs stronger evidence'}
                            </span>
                          </div>
                          <Tag>+{g.impact} pts</Tag>
                        </div>
                      ))
                    ) : (
                      <p>All required skill targets are met.</p>
                    )}
                    <button className="primary full" onClick={() => go('Skill GPS')}>
                      Build my Skill GPS
                      <ArrowRight size={16} />
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}
          {page === 'Skill GPS' && (
            <>
              <PageHeading
                eyebrow="03 / YOUR PERSONAL ROUTE"
                title="Don’t just know the gap. Close it."
                subtitle="A focused learning route, shaped around your next opportunity."
              />
              <div className="roadmap-progress panel content-panel">
                <div>
                  <h2>{data.gaps.length} gaps left to close</h2>
                  <p>
                    {data.user.completedChallenges.length} challenges passed across your account.
                    This route updates after verified improvements.
                  </p>
                </div>
                <button className="secondary" onClick={() => go('My sessions')}>
                  Continue practice
                </button>
                <button className="text-button" onClick={() => go('SkillCredits')}>
                  View my proofs
                </button>
              </div>
              <div className="route-summary">
                <div>
                  <span>CURRENT READINESS</span>
                  <strong>
                    {score}
                    <small>%</small>
                  </strong>
                </div>
                <ArrowRight />
                <div>
                  <span>PROJECTED READINESS</span>
                  <strong className="accent">
                    {data.roadmap.projected}
                    <small>%</small>
                  </strong>
                </div>
                <div>
                  <span>SELF-GUIDED</span>
                  <strong>
                    {data.roadmap.days}
                    <small> days</small>
                  </strong>
                </div>
                <div>
                  <span>WITH YOUR PEERS</span>
                  <strong>
                    {data.roadmap.peerDays}
                    <small> days</small>
                  </strong>
                </div>
              </div>
              <div className="route-layout">
                <section className="panel content-panel">
                  <div className="section-heading">
                    <h2>Your route to {data.opportunity.company}</h2>
                    <Tag>PEER-ASSISTED PATH</Tag>
                  </div>
                  {data.roadmap.steps.length ? (
                    data.roadmap.steps.map((step, i) => (
                      <div className="route-step" key={step.skillId}>
                        <span className="step-number">0{i + 1}</span>
                        <div>
                          <span className="eyebrow">
                            {i === 0 ? 'YOUR NEXT STEP' : 'UP NEXT'} · {step.days - 1} DAYS WITH A
                            PEER
                          </span>
                          <h3>{step.title}</h3>
                          <p>{step.outcome}</p>
                          <GapSteps skillId={step.skillId} days={step.days} />
                          <div className="inline-meta">
                            <Target size={14} />
                            Projected readiness: {step.projectedReadiness}%
                          </div>
                        </div>
                        <button
                          className="secondary"
                          onClick={() => {
                            setSkillId(step.skillId);
                            go('NexusMatch');
                          }}
                        >
                          Find my peer
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <CheckCircle2 size={40} />
                      <h2>You followed through.</h2>
                      <p>
                        Your current skill targets are complete. Your next opportunity is waiting.
                      </p>
                      <button className="primary" onClick={() => go('Opportunities')}>
                        Explore another direction
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                  <div className="route-end">
                    <span>
                      <Target size={20} />
                    </span>
                    <div>
                      <h3>{data.roadmap.projected}% opportunity readiness</h3>
                      <p>A stronger foundation for your next application.</p>
                    </div>
                  </div>
                </section>
                <section className="quote-panel">
                  <Compass size={30} />
                  <blockquote>Progress feels different when you know your next step.</blockquote>
                  <p>
                    Duration estimates assume one focused hour each day. Passing a challenge adds
                    evidence; merely completing a session doesn’t change your skill score.
                  </p>
                  <span className="eyebrow">YOUR PACE. YOUR PATH.</span>
                </section>
              </div>
            </>
          )}
          {page === 'NexusMatch' && (
            <>
              <PageHeading
                eyebrow="04 / BETTER, TOGETHER"
                title="Your next breakthrough has a name."
                subtitle="Meet peers who can help you close a specific gap—and learn something from you."
              />
              <div className="filter-row">
                <span>I want to grow in</span>
                {['docker', 'testing', 'cicd'].map((id) => (
                  <button
                    key={id}
                    className={`filter ${id === skillId ? 'selected' : ''}`}
                    onClick={() => setSkillId(id)}
                  >
                    {names[id]}
                  </button>
                ))}
                <span className="filter-caption">
                  <MapPin size={13} />
                  Your campus network
                </span>
              </div>
              <div className="peer-grid">
                {data.peers.map((peer, i) => (
                  <section className="panel peer-card" key={peer.id}>
                    <div className="peer-top">
                      <span className="avatar" style={{ background: peer.color }}>
                        {peer.initials}
                      </span>
                      <span className="match-score">
                        {peer.match}%<small>MATCH</small>
                      </span>
                    </div>
                    <Tag>{i === 0 ? 'YOUR BEST FIT' : 'VERIFIED CAMPUS PEER'}</Tag>
                    <h2>{peer.name}</h2>
                    <div className="inline-meta">
                      <MapPin size={13} />
                      ABES Engineering College
                    </div>
                    <div className="peer-stats">
                      <div>
                        <strong>{peer.skills[skillId]}</strong>
                        <small>{names[skillId]} skill</small>
                      </div>
                      <div>
                        <strong>{peer.teaching}</strong>
                        <small>Teaching score</small>
                      </div>
                      <div>
                        <strong>{peer.completed}</strong>
                        <small>Sessions</small>
                      </div>
                    </div>
                    <div className="peer-reasons">
                      {peer.reasons.slice(1).map((r) => (
                        <p key={r}>
                          <Check size={13} />
                          {r}
                        </p>
                      ))}
                    </div>
                    {peer.swap && (
                      <div className="swap-note">
                        <ArrowRight size={14} />
                        You share {names[peer.swap]}. They share {names[skillId]}.
                      </div>
                    )}
                    <button
                      className={i === 0 ? 'primary full' : 'secondary full'}
                      disabled={busy}
                      onClick={() => book(peer)}
                    >
                      Learn with {peer.name.split(' ')[0]}
                      <ArrowUpRight size={16} />
                    </button>
                    <button
                      className="peer-chat-button"
                      onClick={() => {
                        setChatPeer(peer.id);
                        go('Messages');
                      }}
                    >
                      <MessageCircle size={16} />
                      Chat with {peer.name.split(' ')[0]}
                      <ArrowUpRight size={15} />
                    </button>
                    <details className="score-details">
                      <summary>Why this match?</summary>
                      {Object.entries(peer.breakdown).map(([k, v]) => (
                        <div key={k}>
                          {k}
                          <span>{v.toFixed(1)} pts</span>
                        </div>
                      ))}
                    </details>
                  </section>
                ))}
              </div>
              <div className="evidence-strip">
                <ShieldCheck size={20} />
                <p>
                  Expertise, teaching, availability, reliability, campus, language, learning level
                  and reciprocity shape your match. Active teaching load also matters.
                </p>
              </div>
            </>
          )}
          {page === 'My sessions' && (
            <>
              <PageHeading
                eyebrow="05 / LEARN. THEN PROVE IT."
                title="Make the connection count."
                subtitle="A good conversation is a beginning. Evidence turns it into progress."
              />
              {data.user.sessions.length === 0 ? (
                <section className="panel empty-state">
                  <Users size={42} />
                  <h2>Your first learning connection is waiting.</h2>
                  <p>Choose a peer through NexusMatch to start a focused session.</p>
                  <button className="primary" onClick={() => go('NexusMatch')}>
                    Find my learning peer
                    <ArrowRight size={16} />
                  </button>
                </section>
              ) : (
                data.user.sessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    sessionId={s.id}
                    data={data}
                    busy={busy}
                    act={act}
                    load={load}
                    notify={setNotice}
                    onChat={() => {
                      setChatPeer(s.peerId);
                      go('Messages');
                    }}
                  />
                ))
              )}
              <div className="evidence-strip">
                <ShieldCheck size={19} />
                <p>
                  Demo sessions are simulated. The knowledge checks are graded on the server. Each
                  passed challenge can award skills and credits only once.
                </p>
              </div>
            </>
          )}
          {page === 'SkillCredits' && (
            <>
              <PageHeading
                eyebrow="06 / YOUR CONTRIBUTIONS, RECOGNIZED"
                title="Good effort leaves a trace."
                subtitle="An auditable record of what you earn through learning and contribution."
              />
              <div className="credit-hero">
                <div>
                  <span className="eyebrow">YOUR SKILLCREDITS BALANCE</span>
                  <strong>
                    {data.balance}
                    <Coins size={35} />
                  </strong>
                  <p>Internal learning points. Earned through contribution.</p>
                </div>
                <div>
                  <span className="eyebrow">YOUR PROGRESS</span>
                  <h2>{data.user.completedChallenges.length} skills strengthened</h2>
                  <p>
                    {improved > 0
                      ? `+${improved} readiness points. Keep your momentum.`
                      : 'Your next challenge is a chance to grow.'}
                  </p>
                  <button className="secondary" onClick={() => go('Skill GPS')}>
                    Keep growing
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
              <CreditGuide data={data} onLearn={() => go('Skill GPS')} />
              <section className="panel content-panel">
                <div className="section-heading">
                  <h2>Your contribution ledger</h2>
                  <Tag>{data.user.ledger.length} TRANSACTIONS</Tag>
                </div>
                <div className="ledger-head">
                  <span>CONTRIBUTION</span>
                  <span>DATE</span>
                  <span>CREDITS</span>
                </div>
                {[...data.user.ledger].reverse().map((e) => (
                  <div className="ledger-row" key={e.id}>
                    <div>
                      <span className="ledger-icon">
                        <Plus size={16} />
                      </span>
                      <span>
                        <strong>{e.reason}</strong>
                        <small>Reference: {e.reference}</small>
                      </span>
                    </div>
                    <span>
                      {new Date(e.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <strong className="accent">
                      {e.amount > 0 ? '+' : ''}
                      {e.amount}
                    </strong>
                  </div>
                ))}
                {data.user.ledger.length === 0 && <p>Your first contribution will appear here.</p>}
              </section>
              <div className="evidence-strip">
                <Activity size={19} />
                <p>
                  SkillCredits are separate from x402 payments. They are internal utility points,
                  with a unique reference for each earned reward.
                </p>
              </div>
            </>
          )}
          {page === 'Skill library' && (
            <SkillLibrary
              data={data}
              onRefresh={load}
              initialCourseId={practiceCourse}
              onAssess={(id) => {
                setAssessmentSkill(id);
                go('Assessments');
              }}
            />
          )}
          {page === 'Assessments' && (
            <Assessments
              userId={data.user.id}
              onRefresh={load}
              initialSkill={assessmentSkill}
              onLearn={(id) => {
                setPracticeCourse(id);
                go('Skill library');
              }}
            />
          )}
          {page === 'Assistant' && (
            <Assistant
              key={data.opportunity.id}
              data={data}
              onRoadmap={() => go('Skill GPS')}
              onProofs={() => go('SkillCredits')}
            />
          )}
          {page === 'Intelligence' && <Premium data={data} busy={busy} act={act} load={load} />}
          {page === 'Messages' && (
            <Chat
              userId={data.user.id}
              initialPeer={chatPeer}
              onFindPeers={() => go('NexusMatch')}
            />
          )}
          <footer className="workspace-footer">
            <span>BHARATSKILL NEXUS</span>
            <p>Your skills. Your people. Your next possibility.</p>
            <span>BUILT TO GROW TOGETHER ↗</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function Simulator({ data, onError }: { data: Dashboard; onError: (s: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [projected, setProjected] = useState(data.readiness.score);
  const [pending, setPending] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    setSelected([]);
    setProjected(data.readiness.score);
    request.current++;
  }, [data.opportunity.id, data.readiness.score]);
  async function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    const seq = ++request.current;
    setPending(true);
    try {
      const result = await post(`/opportunities/${data.opportunity.id}/simulate`, {
        skillIds: next,
      });
      if (seq === request.current) setProjected(result.projected);
    } catch (e) {
      onError((e as Error).message);
      if (seq === request.current) setSelected(selected);
    } finally {
      if (seq === request.current) setPending(false);
    }
  }
  return (
    <section className="panel simulator content-panel">
      <span className="eyebrow">THE OPPORTUNITY SIMULATOR</span>
      <h2>What if you learned…</h2>
      <p>Try a skill. See how your preparation could change.</p>
      <div className="sim-score">
        <span>
          {data.readiness.score}
          <small>%</small>
        </span>
        <ArrowRight size={25} />
        <strong aria-live="polite">
          {pending ? '…' : projected}
          <small>%</small>
        </strong>
      </div>
      {data.gaps.map((g) => (
        <button
          key={g.skillId}
          className={`sim-option ${selected.includes(g.skillId) ? 'selected' : ''}`}
          onClick={() => toggle(g.skillId)}
        >
          <span>
            {selected.includes(g.skillId) ? <Check size={15} /> : <Plus size={15} />} {g.name}
          </span>
          <small>Reach {g.target}/100</small>
        </button>
      ))}
      <small className="footnote">
        A projection, not earned progress. Includes the evidence gained by passing each skill check.
      </small>
    </section>
  );
}
function SessionCard({
  sessionId,
  data,
  busy,
  act,
  load,
  notify,
  onChat,
}: {
  sessionId: string;
  data: Dashboard;
  busy: boolean;
  act: (fn: () => Promise<void>) => void;
  load: () => Promise<void>;
  notify: (s: string) => void;
  onChat: () => void;
}) {
  const session = data.user.sessions.find((s) => s.id === sessionId)!;
  const challenge = data.challenges.find((c) => c.skillId === session.skillId);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState('');
  const done = challenge && data.user.completedChallenges.includes(challenge.id);
  return (
    <section className="panel content-panel session-card">
      <div className="session-header">
        <span className="feature-icon">
          <BookOpen size={23} />
        </span>
        <div>
          <span className="eyebrow">
            {session.status === 'booked' ? 'READY TO START' : 'SESSION COMPLETE'}
          </span>
          <h2>
            {names[session.skillId]} with{' '}
            {session.peerId[0].toUpperCase() + session.peerId.slice(1)}
          </h2>
        </div>
        <Tag>
          <Clock size={12} />
          45 MIN · DEMO SESSION
        </Tag>
      </div>
      <button className="text-button session-chat" onClick={onChat}>
        <MessageCircle size={17} />
        Open peer conversation
        <ArrowUpRight size={16} />
      </button>
      {session.status === 'booked' ? (
        <>
          <p>
            Work through {names[session.skillId]} fundamentals with your peer, discuss common
            mistakes, and then take the knowledge check.
          </p>
          <button
            disabled={busy}
            className="primary"
            onClick={() =>
              act(async () => {
                await post(`/sessions/${session.id}/complete`);
                await load();
              })
            }
          >
            Complete demo session
            <Check size={16} />
          </button>
        </>
      ) : done ? (
        <div className="challenge-complete">
          <CheckCircle2 size={30} />
          <div>
            <h3>Evidence earned. Progress made.</h3>
            <p>
              {names[session.skillId]} is now at least 60/100. +30 SkillCredits added once to your
              ledger.
            </p>
          </div>
        </div>
      ) : challenge ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const r = await post(`/challenges/${challenge.id}/submit`, {
                answers: challenge.questions.map((q) => answers[q.id]),
              });
              if (r.passed) {
                notify(
                  `Knowledge check passed. +30 SkillCredits. SWE internship readiness is now ${r.score}%.`,
                );
                await load();
              } else setResult(r.message + ` (${r.correct}/3 correct)`);
            });
          }}
        >
          <hr />
          <Tag>FOUNDATIONAL KNOWLEDGE CHECK · +30 CREDITS</Tag>
          <h3>{challenge.title}</h3>
          <p>{challenge.brief}</p>
          {challenge.questions.map((q, i) => (
            <fieldset key={q.id}>
              <legend>
                {i + 1}. {q.prompt}
              </legend>
              {q.options.map((option, index) => (
                <label className="quiz-option" key={option}>
                  <input
                    required
                    type="radio"
                    name={`${session.id}-${q.id}`}
                    value={index}
                    checked={answers[q.id] === index}
                    onChange={() => setAnswers({ ...answers, [q.id]: index })}
                  />
                  {option}
                </label>
              ))}
            </fieldset>
          ))}
          {result && (
            <p role="status" className="quiz-result">
              {result}
            </p>
          )}
          <button className="primary" disabled={busy}>
            Verify my knowledge
            <ShieldCheck size={16} />
          </button>
        </form>
      ) : (
        <p>A challenge for this skill is coming in a future release.</p>
      )}
    </section>
  );
}
function Premium({
  data,
  busy,
  act,
  load,
}: {
  data: Dashboard;
  busy: boolean;
  act: (fn: () => Promise<void>) => void;
  load: () => Promise<void>;
}) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [report, setReport] = useState<any>(null);
  const [testnetRequired, setTestnetRequired] = useState(false);
  async function request() {
    try {
      const r = await post(
        '/premium/deep-readiness-analysis',
        { opportunityId: data.opportunity.id },
        payment ? { 'X-Demo-Payment': payment.id } : {},
      );
      setReport(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        if (e.data.payment) setPayment(e.data.payment);
        else setTestnetRequired(true);
        await load();
      } else throw e;
    }
  }
  if (data.mode.payment === 'disabled')
    return (
      <section className="panel content-panel">
        <h1>Premium analysis is coming later</h1>
        <p>
          Payments are disabled in this public preview. Free learning guides and the personal
          assistant are available from your workspace.
        </p>
      </section>
    );
  return (
    <>
      <PageHeading
        eyebrow="07 / A DEEPER UNDERSTANDING"
        title="More clarity for your next move."
        subtitle="A focused opportunity analysis, with pay-per-use infrastructure behind it."
      />
      <div className="premium-layout">
        <section className="panel content-panel">
          <Sparkles size={31} />
          <h2 className="large-title">Deep Opportunity Intelligence</h2>
          <p>
            Understand your evidence, learning priorities and the peer-assisted path to your next
            opportunity.
          </p>
          <div className="premium-features">
            {[
              'Explainable readiness breakdown',
              'Evidence and skill-gap analysis',
              'Personal learning priorities',
              'Peer-assisted Skill GPS',
            ].map((t) => (
              <p key={t}>
                <Check size={16} />
                {t}
              </p>
            ))}
          </div>
          <div className="payment-price">
            <strong>0.005</strong>
            <span>Testnet USDC / analysis</span>
          </div>
          <Tag>
            {data.mode.payment === 'sandbox' ? 'SANDBOX · NO REAL PAYMENT' : 'ALGORAND TESTNET'}
          </Tag>
          <p className="muted">
            {data.mode.payment === 'sandbox'
              ? 'Experience the request → 402 → settlement → result flow. Sandbox settlement creates no blockchain transaction.'
              : 'Use the included Testnet payment client to sign and settle through the facilitator. No private keys enter this browser.'}
          </p>
          <button className="primary full" disabled={busy} onClick={() => act(request)}>
            {busy ? 'Preparing analysis…' : 'Request deep analysis'}
            <ArrowUpRight size={16} />
          </button>
          {testnetRequired && (
            <div className="payment-required" role="status">
              <span className="eyebrow">402 · ALGORAND TESTNET</span>
              <p>
                The service requires a signed Testnet payment. Use the included payment client with
                a funded Testnet account. Settlement proof and the unlocked report appear in the
                client.
              </p>
            </div>
          )}
          {payment && !report && (
            <div className="payment-required" role="status">
              <span className="eyebrow">402 · PAYMENT REQUIRED</span>
              <p>Your sandbox payment request is ready. No funds will move.</p>
              <button
                className="secondary full"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    const p = await post(`/payments/${payment.id}/sandbox-settle`);
                    setPayment(p);
                    const r = await post(
                      '/premium/deep-readiness-analysis',
                      { opportunityId: data.opportunity.id },
                      { 'X-Demo-Payment': payment.id },
                    );
                    setReport(r);
                    await load();
                  })
                }
              >
                Simulate settlement & unlock
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>
        <section className="panel content-panel report-panel">
          <span className="eyebrow">YOUR INTELLIGENCE REPORT</span>
          {report ? (
            <>
              <div className="report-score">
                <strong>{report.readiness.score}%</strong>
                <Tag>ANALYSIS UNLOCKED</Tag>
              </div>
              <h2>Your next move, explained.</h2>
              <p>{report.summary}</p>
              <h3>Focus here next</h3>
              {report.nextActions.length ? (
                report.nextActions.map((a: string) => (
                  <p className="report-action" key={a}>
                    <ArrowUpRight size={16} />
                    {a}
                  </p>
                ))
              ) : (
                <p>
                  Your current skill targets are met. Build a project that brings them together.
                </p>
              )}
              <div className="payment-trace">
                <CheckCircle2 size={18} />
                <div>
                  <strong>
                    {data.mode.payment === 'sandbox'
                      ? 'Sandbox flow completed'
                      : 'Testnet resource served'}
                  </strong>
                  <small>{report.payment.id ?? 'Settlement details in the payment client'}</small>
                </div>
              </div>
              <small className="footnote">
                Explanation source: {report.provider}. Numerical scores always come from the
                server’s deterministic engine.
              </small>
            </>
          ) : (
            <div className="report-empty">
              <Network size={65} strokeWidth={0.65} />
              <h3>A clearer picture awaits.</h3>
              <p>Your analysis will appear here after the payment flow completes.</p>
              <div className="flow-steps">
                <span>REQUEST</span>
                <ChevronRight size={12} />
                <span>402</span>
                <ChevronRight size={12} />
                <span>SETTLE</span>
                <ChevronRight size={12} />
                <span>INSIGHT</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
export default App;
