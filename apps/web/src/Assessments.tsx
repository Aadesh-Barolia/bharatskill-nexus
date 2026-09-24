import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck } from 'lucide-react';
import type {
  AssessmentSummary,
  AssessmentQuiz,
  AssessmentResult,
  AssessmentAttempt,
} from '@nexus/shared';
import { api, post } from './api';
type Catalog = { items: AssessmentSummary[]; history: AssessmentAttempt[] };
export default function Assessments({
  userId,
  onRefresh,
  onLearn,
  initialSkill = '',
}: {
  userId: string;
  onRefresh: () => Promise<void>;
  onLearn: (courseId: string) => void;
  initialSkill?: string;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [quiz, setQuiz] = useState<AssessmentQuiz | null>(null),
    [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<number[]>([]),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [search, setSearch] = useState(initialSkill),
    [remaining, setRemaining] = useState(0);
  const clearDraft = () => { try { sessionStorage.removeItem(`nexus-assessment:${userId}`); } catch {} };
  const draftKey = `nexus-assessment:${userId}`;
  const restored = useRef(false);
  const [restoring,setRestoring]=useState(true);
  const refresh = async () => setCatalog(await api<Catalog>('/assessments'));
  useEffect(() => {
    let active = true;
    api<Catalog>('/assessments')
      .then((c) => {
        if (active) setCatalog(c);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if(restored.current)return;
    restored.current=true;
    const restore=async()=>{
      try{
        const raw=sessionStorage.getItem(draftKey);
        if(!raw)return;
        const draft=JSON.parse(raw);
        if(typeof draft.skillId!=='string'||typeof draft.id!=='string')return;
        // Fetch the authoritative attempt; never grade against browser-stored questions.
        const q=await post<AssessmentQuiz>(`/assessments/${encodeURIComponent(draft.skillId)}/start`);
        if(q.attempt.id!==draft.id){clearDraft();return;}
        const valid=Array.isArray(draft.answers)&&draft.answers.length===q.questions.length&&draft.answers.every((v:unknown)=>Number.isInteger(v)&&Number(v)>=-1&&Number(v)<=2);
        setQuiz(q);setAnswers(valid?draft.answers:q.questions.map(()=>-1));
        setStep(Number.isInteger(draft.step)?Math.max(0,Math.min(q.questions.length-1,draft.step)):0);
      }catch{clearDraft()}finally{setRestoring(false)}
    };
    void restore();
  },[draftKey]);
  useEffect(()=>{
    if(!quiz)return;
    try{sessionStorage.setItem(draftKey,JSON.stringify({id:quiz.attempt.id,skillId:quiz.attempt.skillId,answers,step}))}catch{}
  },[quiz,answers,step,draftKey]);
  useEffect(() => {
    if (!quiz) return;
    const tick = () =>
      setRemaining(
        Math.max(0, Math.ceil((Date.parse(quiz.attempt.expiresAt) - Date.now()) / 1000)),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [quiz]);
  async function start(skillId: string) {
    setBusy(true);
    setError('');
    try {
      const q = await post<AssessmentQuiz>(`/assessments/${skillId}/start`);
      setQuiz(q);
      setAnswers(q.questions.map(() => -1));
      setStep(0);
      setResult(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!quiz) return;
    setBusy(true);
    setError('');
    try {
      const r = await post<AssessmentResult>(`/assessments/attempts/${quiz.attempt.id}/submit`, {
        answers,
      });
      clearDraft();
      setResult(r);
      setQuiz(null);
      await refresh();
      await onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function view(id: string) {
    setBusy(true);
    setError('');
    try {
      setResult(await api<AssessmentResult>(`/assessments/attempts/${id}`));
      clearDraft();
      setQuiz(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const back = () => {
    clearDraft();
    setQuiz(null);
    setResult(null);
    setError('');
  };
  if(restoring)return <p role="status">Checking for your unfinished test…</p>;
  return (
    <section className="assessment-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FIND YOUR STARTING POINT</span>
          <h1>Skill assessments</h1>
          <p>A small check today. A clearer next step tomorrow.</p>
        </div>
        <span className="tag">FREE · FOUNDATION LEVEL</span>
      </div>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {(quiz || result) && (
        <button className="text-button" disabled={busy} onClick={back}>
          <ArrowLeft size={16} />
          Back to assessments
        </button>
      )}
      {quiz ? (
        <div className="assessment-panel">
          <div className="assessment-meta">
            <span>{quiz.name}</span>
            <span>
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} remaining
            </span>
          </div>
          <progress
            value={answers.filter((a) => a >= 0).length}
            max={quiz.questions.length}
            aria-label="Questions answered"
          />
          {remaining === 0 && (
            <p role="alert" className="alert error">
              This attempt has expired. Go back and start again.
            </p>
          )}
          <fieldset key={step} disabled={busy || remaining === 0}>
            <legend>
              <span className="eyebrow">
                QUESTION {step + 1} OF {quiz.questions.length} · {quiz.questions[step].topic}
              </span>
              <span className="assessment-question">{quiz.questions[step].prompt}</span>
            </legend>
            {quiz.questions[step].options.map((option, i) => (
              <label
                key={i}
                className={`assessment-option ${answers[step] === i ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${step}`}
                  checked={answers[step] === i}
                  onChange={() => setAnswers((a) => a.map((v, index) => (index === step ? i : v)))}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          <div className="assessment-actions">
            <button
              className="secondary"
              disabled={busy || step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </button>
            <span>
              {answers.filter((a) => a >= 0).length} / {quiz.questions.length} answered
            </span>
            {step < quiz.questions.length - 1 ? (
              <button
                className="primary"
                disabled={answers[step] < 0 || busy}
                onClick={() => setStep((s) => s + 1)}
              >
                Next question
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="primary"
                disabled={busy || remaining === 0 || answers.some((a) => a < 0)}
                onClick={() => void submit()}
              >
                {busy ? 'Checking answers…' : 'Finish assessment'}
              </button>
            )}
          </div>
          <p className="assessment-note">
            Choose one answer per question. You can review earlier answers before finishing. Your
            selections are saved in this tab. Refreshing resumes your test; Back to assessments clears selections.
          </p>
        </div>
      ) : result ? (
        <>
          <div className="assessment-result">
            <div>
              <span className="eyebrow">{result.name} · RESULT</span>
              <h2>{result.band}</h2>
              <p>
                {result.review.filter((q) => q.correct).length} of {result.review.length} answers
                correct
              </p>
            </div>
            <strong>
              {result.attempt.score}
              <small>% knowledge check</small>
            </strong>
          </div>
          <div className="assessment-panel">
            <h2>Your next steps</h2>
            <p>
              Profile skill score: {result.attempt.profileBefore} → {result.attempt.profileAfter}.
              Foundation quizzes contribute up to 60/100; stronger existing scores are preserved.
            </p>
            <p className="assessment-note">
              This is an informal knowledge check, not a certification or practical skill
              verification. No SkillCredits or verified proofs are awarded. Readiness changes only
              when the assessed skill is required by an opportunity.
            </p>
            {result.nextSteps.length ? (
              <ol className="assessment-roadmap">
                {result.nextSteps.map((s, i) => (
                  <li key={i}>
                    <h3>{s.topic}</h3>
                    <p>{s.exercise}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                <CheckCircle2 size={18} /> All foundations answered correctly. Apply them in a real
                task and ask a peer for feedback.
              </p>
            )}
            <button className="primary" onClick={() => onLearn(result.courseId)}>
              Open my practice guide
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="assessment-panel">
            <h2>Answer review</h2>
            {result.review.map((q, i) => (
              <article
                className={`assessment-review ${q.correct ? 'correct' : 'incorrect'}`}
                key={q.id}
              >
                <span className="tag">
                  {q.correct ? 'CORRECT' : 'REVIEW THIS'} · {q.topic}
                </span>
                <h3>
                  {i + 1}. {q.prompt}
                </h3>
                <p>Your answer: {q.options[q.selected]}</p>
                {!q.correct && <p>Correct answer: {q.options[q.answer]}</p>}
                <p>{q.explanation}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="assessment-intro">
            <ClipboardCheck size={32} />
            <div>
              <h2>Check your foundations</h2>
              <p>
                Four questions per skill, around 3–5 minutes. Get a saved result, explanations and a
                practice plan. All foundation checks are free; advanced learning guides retain their
                premium access rules.
              </p>
            </div>
          </div>
          <label className="assessment-search">
            Find a skill
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try Git, communication or Python"
            />
          </label>
          {!catalog && !error && <p role="status">Loading assessments…</p>}
          <div className="assessment-grid">
            {catalog?.items
              .filter((c) =>
                (c.name + ' ' + c.skillId + ' ' + c.category)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((c) => (
                <article key={c.skillId}>
                  <span className="eyebrow">{c.category}</span>
                  <h2>{c.name}</h2>
                  <p>{c.questions} questions · Foundation knowledge</p>
                  {c.latest ? (
                    <p className="assessment-last">
                      Latest result: <strong>{c.latest.score}%</strong> ·{' '}
                      {new Date(c.latest.submittedAt!).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="assessment-last">Discover your starting point</p>
                  )}
                  <div className="assessment-card-actions">
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => void start(c.skillId)}
                    >
                      {c.latest ? 'Try again' : 'Start assessment'}
                      <ArrowRight size={16} />
                    </button>
                    {c.latest && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => void view(c.latest!.id)}
                      >
                        View result
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
          {catalog &&
            !catalog.items.some((c) =>
              (c.name + ' ' + c.skillId + ' ' + c.category)
                .toLowerCase()
                .includes(search.toLowerCase()),
            ) && <p>No skills match. Try another search.</p>}
          {!!catalog?.history.length && (
            <div className="assessment-panel">
              <h2>Recent results</h2>
              <p>Your latest 60 attempts are retained.</p>
              {catalog.history.slice(0, 12).map((a) => (
                <button
                  className="assessment-history"
                  disabled={busy}
                  key={a.id}
                  onClick={() => void view(a.id)}
                >
                  <span>
                    {catalog.items.find((c) => c.skillId === a.skillId)?.name}
                    <small>{new Date(a.submittedAt!).toLocaleString()}</small>
                  </span>
                  <strong>{a.score}%</strong>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
