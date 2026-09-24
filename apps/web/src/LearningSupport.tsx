import type { Dashboard } from '@nexus/shared';
import { ShieldCheck, Download, ArrowRight } from 'lucide-react';
export function CreditGuide({ data, onLearn }: { data: Dashboard; onLearn: () => void }) {
  function download() {
    const record = {
      exportedAt: new Date().toISOString(),
      learner: data.user.name,
      disclaimer:
        'Nexus progress record. Foundational knowledge checks, not an accredited certificate. Demo seed records are not independently verified.',
      proofs: data.user.evidence,
      ledger: data.user.ledger,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-learning-proofs.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="credit-guide">
        <article className="panel content-panel">
          <span className="eyebrow">01 / EARN</span>
          <h2>Learn → practice → prove</h2>
          <p>
            Choose a gap, complete its demo peer session, then pass all questions in the knowledge
            check. Each challenge rewards credits only once.
          </p>
          <ul>
            {data.challenges.map((c) => (
              <li key={c.id}>
                {c.title}: <b>+{c.reward} credits</b>
                {data.user.completedChallenges.includes(c.id) ? ' · Earned' : ''}
              </li>
            ))}
          </ul>
          <p className="chart-caption">
            Failed checks and repeated passes earn nothing. The demo's opening 120 credits are
            sample data; registered accounts begin at zero.
          </p>
          <button className="secondary" onClick={onLearn}>
            Find my next challenge <ArrowRight size={16} />
          </button>
        </article>
        <article className="panel content-panel">
          <span className="eyebrow">02 / USE</span>
          <h2>Your contribution record</h2>
          <p>
            Today, credits show your learning contributions in an auditable ledger. Use it to see
            what you earned and the challenge behind each reward.
          </p>
          <p>
            <b>Spending and redemption are not available yet.</b> Credits cannot pay for peer
            sessions, premium analysis or x402 payments, and cannot be withdrawn as money.
          </p>
          <p className="chart-caption">
            Possible future uses, such as session bookings, need an approved credit economy and a
            working redemption flow before they appear as benefits.
          </p>
        </article>
      </div>
      <section className="panel content-panel proof-gallery">
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / PROOFS</span>
            <h2>Evidence behind your progress</h2>
          </div>
          <button className="secondary" onClick={download}>
            <Download size={16} />
            Export my records
          </button>
        </div>
        <p>
          Knowledge-check proofs confirm a server-graded fundamentals check. They are not accredited
          certificates or independently reviewed projects.
        </p>
        {data.user.evidence.length ? (
          data.user.evidence.map((e) => (
            <article className="proof-record" key={e.id}>
              <ShieldCheck size={21} />
              <div>
                <h3>{e.title}</h3>
                <span>
                  {e.skillId} · {e.type} · {new Date(e.createdAt).toLocaleDateString()}
                </span>
                <p>
                  {e.type === 'knowledge-check' && e.verified
                    ? 'Knowledge check passed · foundational evidence'
                    : e.verified
                      ? 'Recorded as verified in this profile · source not independently reviewed here'
                      : 'Unverified evidence'}
                </p>
                <small>Proof ID: {e.id}</small>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>No proof records yet</h3>
            <p>
              Pass your first eligible challenge to add a proof here. Viewing a lesson or asking the
              coach does not create evidence.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
export function GapSteps({ skillId, days }: { skillId: string; days: number }) {
  const content: Record<string, string[]> = {
    docker: [
      'Learn images, containers, ports and volumes. Explain the difference between an image and a running container.',
      'Containerize a small Node service. Stop and restart it, then check which data survives.',
      'Walk a peer through the Dockerfile and fix one broken port mapping.',
    ],
    testing: [
      'Learn assertions, unit tests and integration tests. Identify a successful case and a failure case.',
      'Write API tests for valid input, invalid input and a missing resource. Run them and explain one failure.',
      'Ask a peer to break a test assumption, then improve your test coverage.',
    ],
    cicd: [
      'Learn workflow triggers, jobs and build gates. Sketch the path from commit to checks.',
      'Create a pipeline that installs dependencies, runs tests and builds the project.',
      'Introduce a failing test and confirm the pipeline stops. Review the result with a peer.',
    ],
  };
  const steps = content[skillId] ?? [
    `Review the core concepts for ${skillId} and identify one concept you cannot yet explain.`,
    `Build a small ${skillId} exercise and record what worked and what failed.`,
    'Review your work with a peer and collect evidence.',
  ];
  return (
    <details className="gap-checklist" open>
      <summary>Learning plan · about {days} focused hours</summary>
      <ol>
        {steps.map((s, i) => (
          <li key={s}>
            <b>{['Learn', 'Practice', 'Review'][i]}</b>
            <span>{s}</span>
          </li>
        ))}
        <li>
          <b>Verify</b>
          <span>
            {['docker', 'testing', 'cicd'].includes(skillId)
              ? 'Complete the demo session, then pass its knowledge check in My sessions. Your proof, credits and remaining roadmap update automatically.'
              : 'This skill has no built-in challenge yet. Evidence submission and reviewer verification are still needed; reading this plan cannot close the gap.'}
          </span>
        </li>
      </ol>
      <small>
        Suggested practice steps, not a completed course. Progress is awarded only by the server's
        verification flow.
      </small>
    </details>
  );
}
