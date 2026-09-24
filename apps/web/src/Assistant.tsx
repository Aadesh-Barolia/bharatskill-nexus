import { useState } from 'react';
import { Sparkles, ArrowRight, Send, ShieldCheck } from 'lucide-react';
import type { Dashboard } from '@nexus/shared';
import { post } from './api';
type Answer = {
  summary: string;
  nextActions: string[];
  provider: string;
  fallbackUsed?: boolean;
  readiness: { score: number };
};
export default function Assistant({
  data,
  onRoadmap,
  onProofs,
}: {
  data: Dashboard;
  onRoadmap: () => void;
  onProofs: () => void;
}) {
  const [question, setQuestion] = useState(''),
    [answer, setAnswer] = useState<Answer | null>(null),
    [asked, setAsked] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function ask(q: string) {
    if (busy || q.trim().length < 3) return;
    setBusy(true);
    setError('');
    setAsked(q);
    setAnswer(null);
    try {
      setAnswer(
        await post<Answer>('/assistant', { question: q, opportunityId: data.opportunity.id }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="coach-page">
      <div className="page-heading">
        <span className="eyebrow">PERSONAL LEARNING SUPPORT</span>
        <h1>Your learning coach</h1>
        <p>Understand your gaps, plan your next session, and make sense of your progress.</p>
      </div>
      <div className="coach-layout">
        <div className="panel content-panel">
          <Sparkles size={28} />
          <h2>What would you like help with?</h2>
          <p>
            Ask about a skill, your roadmap, credits or proofs. Each question uses your current
            opportunity and recorded progress.
          </p>
          <div className="coach-prompts">
            {[
              'What should I learn next?',
              'How do I earn and use credits?',
              'What counts as proof?',
            ].map((q) => (
              <button
                className="secondary"
                key={q}
                disabled={busy}
                onClick={() => {
                  setQuestion(q);
                  void ask(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <label htmlFor="coach-question">Your question</label>
            <textarea
              id="coach-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              minLength={3}
              maxLength={1000}
              required
              placeholder="Help me plan my Docker practice…"
            />
            <button className="primary" disabled={busy || question.trim().length < 3}>
              {busy ? 'Preparing your guidance…' : 'Ask my coach'}
              <Send size={16} />
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
          <div aria-live="polite" aria-busy={busy}>
            {answer && (
              <article className="coach-answer">
                <span className="tag">
                  {['gemini','groq'].includes(answer.provider)
                    ? `AI · ${answer.provider.toUpperCase()}${answer.fallbackUsed ? ' · BACKUP PROVIDER' : ''}`
                    : answer.provider === 'template-fallback'
                      ? 'AI UNAVAILABLE · BUILT-IN GUIDANCE'
                      : 'BUILT-IN GUIDANCE · AI NOT CONFIGURED'}
                </span>
                <h3>{asked}</h3>
                <p>{answer.summary}</p>
                <h4>Suggested next steps</h4>
                {answer.nextActions.length ? (
                  <ul>
                    {answer.nextActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Review your evidence or choose a new opportunity.</p>
                )}
                <small>
                  Server-calculated readiness: {answer.readiness.score}%. Asking questions never
                  changes scores or credits.
                </small>
              </article>
            )}
          </div>
        </div>
        <aside className="panel content-panel">
          <ShieldCheck size={26} />
          <h2>Grounded in your progress</h2>
          <p>
            <b>{data.opportunity.title}</b>
            <br />
            {data.readiness.score}% readiness · {data.gaps.length} skill gaps
          </p>
          <p>
            Gemini provides AI guidance, with Groq as a backup when configured. If neither can answer, a clearly
            labelled built-in coach explains your saved progress. General tutoring requires AI.
          </p>
          <p className="chart-caption">
            With AI enabled, your question, opportunity, readiness, gaps, credit balance and proof
            count are sent to the configured provider (Gemini, then Groq if needed). Your private messages, email and credentials are not included. Questions
            are not stored by Nexus. Avoid entering sensitive information.
          </p>
          <button className="secondary full" onClick={onRoadmap}>
            Open my roadmap <ArrowRight size={16} />
          </button>
          <button className="text-button" onClick={onProofs}>
            Review credits & proofs
          </button>
        </aside>
      </div>
    </section>
  );
}
