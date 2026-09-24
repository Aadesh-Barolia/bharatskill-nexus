import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Lock, Search, Sparkles, Check } from 'lucide-react';
import type {
  Dashboard,
  LearningCatalog,
  LearningCourse,
  LearningDetail,
  LearningLevel,
} from '@nexus/shared';
import { api, post } from './api';
export default function SkillLibrary({
  data,
  onRefresh,
  initialCourseId,
  onAssess,
}: {
  initialCourseId?: string;
  onAssess?: (skillId: string) => void;
  data: Dashboard;
  onRefresh: () => Promise<void>;
}) {
  const [catalog, setCatalog] = useState<LearningCatalog | null>(null),
    [level, setLevel] = useState<LearningLevel>('Beginner'),
    [category, setCategory] = useState('All areas'),
    [search, setSearch] = useState(''),
    [detail, setDetail] = useState<LearningDetail | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [premiumPrompt, setPremiumPrompt] = useState(false);
  useEffect(() => {
    let active = true;
    api<LearningCatalog>('/learning')
      .then((c) => {
        if (active) setCatalog(c);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [data.user.learningPremium]);
  useEffect(() => {
    if (!initialCourseId) return;
    let active = true;
    api<LearningDetail>(`/learning/${initialCourseId}`)
      .then((c) => {
        if (active) setDetail(c);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [initialCourseId]);
  async function open(course: LearningCourse) {
    setNotice('');
    setError('');
    if (course.locked) {
      setPremiumPrompt(true);
      return;
    }
    setBusy(true);
    try {
      setDetail(await api<LearningDetail>(`/learning/${course.id}`));
      window.dispatchEvent(new Event('nexus:navigate'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function unlock() {
    setBusy(true);
    setError('');
    try {
      await post('/learning/premium/demo-unlock', { confirm: true });
      setCatalog(await api<LearningCatalog>('/learning'));
      await onRefresh();
      setPremiumPrompt(false);
      setNotice('Premium preview unlocked for this account. No payment was charged.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    if (!detail) return;
    setBusy(true);
    setError('');
    try {
      await post(`/learning/${detail.id}/start`);
      await onRefresh();
      setNotice(`${detail.skillName} is in your profile. Your verified score stays unchanged.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const courses =
    catalog?.courses.filter(
      (c) =>
        c.level === level &&
        (category === 'All areas' || category === c.category) &&
        `${c.skillName} ${c.title} ${c.category}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  return (
    <div className="skill-library">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A SKILL FOR EVERY NEXT STEP</span>
          <h1>Explore your skills</h1>
          <p>
            Build confidence, think clearly and grow your technical skills. Start where you are.
          </p>
        </div>
        <span className="tag">{catalog?.premium ? 'PREMIUM PREVIEW ACTIVE' : 'FREE LEARNING'}</span>
      </div>
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="library-notice">
          {notice}
        </p>
      )}
      {!catalog && !error && <p role="status">Loading your learning library…</p>}
      {detail ? (
        <>
          <button
            className="text-button"
            onClick={() => {
              setDetail(null);
              setNotice('');
            }}
          >
            <ArrowLeft size={16} />
            Back to skill library
          </button>
          <section className="panel content-panel course-detail">
            <span className="eyebrow">
              {detail.skillName} / {detail.level}
            </span>
            <h2>{detail.title}</h2>
            <p>{detail.summary}</p>
            {onAssess && (
              <button className="secondary" onClick={() => onAssess(detail.skillId)}>
                Check my foundations
              </button>
            )}
            <div className="course-detail-meta">
              <span>{detail.minutes} minutes suggested practice</span>
              <span>{detail.prerequisite}</span>
            </div>
            <button
              className="primary"
              disabled={busy || data.user.skills.some((s) => s.id === detail.skillId)}
              onClick={() => void start()}
            >
              {data.user.skills.some((s) => s.id === detail.skillId)
                ? 'Already in your skills'
                : 'Add skill to my profile'}
              <Check size={16} />
            </button>
            <p className="chart-caption">
              Adding a skill starts it at zero unless you already have a recorded score. These
              self-guided exercises do not award credits or verified proofs.
            </p>
          </section>
          <div className="library-lessons">
            {detail.lessons.map((lesson, i) => (
              <article key={lesson.title} className="panel content-panel">
                <span className="eyebrow">STEP {i + 1} / 3</span>
                <h2>{lesson.title}</h2>
                <p>{lesson.explanation}</p>
                <div className="practice-brief">
                  <b>Your practice task</b>
                  <p>{lesson.exercise}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        catalog && (
          <>
            <section className="library-premium panel">
              <Sparkles size={25} />
              <div>
                <h2>
                  {catalog.premium
                    ? 'Your advanced guides are open'
                    : 'Go further with advanced learning'}
                </h2>
                <p>
                  Beginner and intermediate guides are free. Advanced guides require premium access.
                </p>
                <small>
                  {catalog.premium
                    ? 'Sandbox entitlement saved to this account. No money was charged.'
                    : 'Premium preview uses a separate sandbox unlock. Real subscription billing is not connected; SkillCredits and analysis payments do not unlock this library.'}
                </small>
              </div>
              {!catalog.premium && (
                <button className="primary" onClick={() => setPremiumPrompt(!premiumPrompt)}>
                  {premiumPrompt ? 'Hide premium preview' : 'View premium'}
                  <ArrowRight size={16} />
                </button>
              )}
            </section>
            {premiumPrompt && !catalog.premium && (
              <section className="panel content-panel premium-preview" aria-label="Premium preview">
                <h2>Unlock advanced guides in the demo</h2>
                <p>
                  Open all 12 advanced guides for this account. This is a sandbox preview, not a
                  purchase or a subscription. Your scores and credits stay unchanged.
                </p>
                {catalog.sandboxAvailable ? (
                  <button className="primary" disabled={busy} onClick={() => void unlock()}>
                    Confirm free demo unlock <Lock size={16} />
                  </button>
                ) : (
                  <p>
                    Premium checkout is not available in this environment yet. Advanced content
                    remains locked.
                  </p>
                )}
                <button className="text-button" onClick={() => setPremiumPrompt(false)}>
                  Cancel
                </button>
              </section>
            )}
            <div className="library-levels" role="group" aria-label="Learning level">
              {(['Beginner', 'Intermediate', 'Advanced'] as LearningLevel[]).map((l, i) => (
                <button
                  key={l}
                  aria-pressed={level === l}
                  className={level === l ? 'selected' : ''}
                  onClick={() => setLevel(l)}
                >
                  <span>0{i + 1}</span>
                  <b>{l}</b>
                  <small>
                    {l === 'Advanced'
                      ? catalog.premium
                        ? 'Premium unlocked'
                        : 'Premium required'
                      : 'Free access'}
                  </small>
                  {l === 'Advanced' && !catalog.premium && <Lock size={16} />}
                </button>
              ))}
            </div>
            <div className="library-filters">
              <label className="path-search">
                <Search size={18} />
                <input
                  aria-label="Search skills"
                  placeholder="Search speaking, Git, data…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label>
                Skill area
                <select
                  aria-label="Skill area"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {['All areas', ...new Set(catalog.courses.map((c) => c.category))].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <span>
                {courses.length} guides · {level}
              </span>
            </div>
            <div className="library-cards">
              {courses.map((c) => (
                <article key={c.id} className="library-card panel">
                  <div className="library-card-top">
                    <BookOpen size={22} />
                    <span>{c.category}</span>
                    {c.locked && <Lock size={17} aria-label="Premium locked" />}
                  </div>
                  <div className="library-card-body">
                    <span className="eyebrow">{c.skillName}</span>
                    <h2>{c.title}</h2>
                    <p>{c.summary}</p>
                    <small>{c.prerequisite}</small>
                    <div className="library-card-footer">
                      <span>{c.minutes} min · Practice guide</span>
                      <button className="text-button" disabled={busy} onClick={() => void open(c)}>
                        {c.locked ? 'Unlock with premium' : 'Open guide'}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!courses.length && (
              <p role="status" className="empty-state">
                No skills match these filters. Try another level, area or search.
              </p>
            )}
            <p className="chart-caption">
              Guides are authored practice material. The existing Docker, Testing and CI/CD demo
              challenges remain the only graded challenges. An advanced guide unlock does not
              certify advanced proficiency.
            </p>
          </>
        )
      )}
    </div>
  );
}
