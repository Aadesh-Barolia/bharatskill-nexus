import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { post } from './api';
type Challenge = { requestId: string; delivery: string; previewCode?: string; resendAfter: number };
export default function OtpForm({
  register,
  onAuthenticated,
}: {
  register: boolean;
  onAuthenticated: () => Promise<void>;
}) {
  const [email, setEmail] = useState(''),
    [name, setName] = useState(''),
    [code, setCode] = useState(''),
    [challenge, setChallenge] = useState<Challenge | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  async function send() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const c = await post<Challenge>('/auth/otp/request', {
        email: email.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      setChallenge(c);
      setCode('');
      setSeconds(c.resendAfter);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (!challenge || busy) return;
    setBusy(true);
    setError('');
    try {
      await post('/auth/otp/verify', { email: email.trim(), requestId: challenge.requestId, code });
      await onAuthenticated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void (challenge ? verify() : send());
      }}
    >
      {!challenge && register && (
        <label>
          Your name
          <input
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </label>
      )}
      <label>
        Email address
        <input
          autoFocus
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={254}
          readOnly={!!challenge}
        />
      </label>
      {!challenge && (
        <p className="chart-caption">
          We’ll send a sign-in code. No password needed. Verifying a new email creates an account
          with no earned progress.
        </p>
      )}
      {challenge && (
        <>
          <p role="status">
            {challenge.delivery === 'local-preview'
              ? 'Local test only — no email was sent.'
              : `A sign-in code was sent to ${email.trim()}. Check your spam folder too.`}{' '}
            The code expires in 10 minutes.
          </p>
          {challenge.previewCode && (
            <p className="otp-preview">
              LOCAL DEMO CODE: <strong>{challenge.previewCode}</strong>
            </p>
          )}
          <label>
            Six-digit code
            <input
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </label>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <button className="primary full" disabled={busy}>
        {busy ? 'Please wait…' : challenge ? 'Verify & continue' : 'Send sign-in code'}
        <ArrowRight size={16} />
      </button>
      {challenge && (
        <div className="otp-actions">
          <button
            type="button"
            className="text-button"
            disabled={busy || seconds > 0}
            onClick={() => void send()}
          >
            {seconds ? `Resend in ${seconds}s` : 'Resend code'}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setChallenge(null);
              setCode('');
              setError('');
            }}
          >
            Change email
          </button>
        </div>
      )}
    </form>
  );
}
