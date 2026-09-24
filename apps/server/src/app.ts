import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { z, ZodError } from 'zod';
import type { Opportunity, UserState } from '@nexus/shared';
import { Store } from './store.js';
import { seedUser, opportunities, challenges, answerKeys } from './catalog.js';
import { gaps, readiness, roadmap, recommendations, simulate } from './engines.js';
import { explain } from './explanations.js';
import { testnetMiddleware } from './payments.js';
import { chatRouter } from './chat.js';
import { learningRouter } from './learning.js';
import { otpRouter } from './otp.js';
import { assessmentRouter } from './assessments.js';
const fail = (status: number, message: string) => Object.assign(Error(message), { status });
const publicUser = (u: UserState) => {
  const { passwordHash, conversations, ...safe } = u;
  return safe;
};
type Options = {
  secret: string;
  origin: string;
  demo: boolean;
  payment: string;
  trustProxy?: number;
  adminEmail?: string;
  adminEmails?: string[];
  otpDelivery?: (email: string, code: string) => Promise<void>;
};
export function createApp(store: Store, options: Options) {
  const app = express();
  app.disable('x-powered-by');
  if (options.trustProxy) app.set('trust proxy', options.trustProxy);
  const trustedOrigins = new Set([options.origin]);
  if (options.demo) {
    const local = new URL(options.origin);
    if (['localhost', '127.0.0.1'].includes(local.hostname)) {
      local.hostname = local.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
      trustedOrigins.add(local.origin);
    }
  }
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: (origin, done) => done(null, !origin || trustedOrigins.has(origin)),
      credentials: true,
      exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE'],
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use(
    '/api',
    rateLimit({ windowMs: 60000, limit: 240, standardHeaders: 'draft-8', legacyHeaders: false }),
  );
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      !trustedOrigins.has(req.headers.origin)
    )
      return next(fail(403, 'Untrusted origin'));
    next();
  });
  const login = (res: Response, user: UserState, method = 'demo') => {
    res.cookie(
      'nexus_session',
      jwt.sign({ sub: user.id, amr: method }, options.secret, {
        expiresIn: '24h',
        issuer: 'bharatskill-nexus',
        audience: 'nexus-web',
      }),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: options.origin.startsWith('https:'),
        maxAge: 86400000,
        path: '/',
      },
    );
  };
  const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.nexus_session || req.headers.authorization?.replace(/^Bearer /, '');
      const payload = jwt.verify(token ?? '', options.secret, {
        issuer: 'bharatskill-nexus',
        audience: 'nexus-web',
        algorithms: ['HS256'],
      });
      if (typeof payload === 'string' || !payload.sub) throw Error();
      const user = await store.get(payload.sub);
      if (!user) throw Error();
      res.locals.user = user;
      res.locals.emailOtp = payload.amr === 'email_otp';
      next();
    } catch {
      next(fail(401, 'Please sign in to your Nexus'));
    }
  };
  const current = (res: Response) => res.locals.user as UserState;
  const opportunity = (id: unknown = 'swe-intern'): Opportunity => {
    const result = opportunities.find((o) => o.id === id);
    if (!result) throw fail(404, 'Opportunity not found');
    return result;
  };
  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, storage: store.mode, payment: options.payment, demo: options.demo }),
  );
  app.use('/api/auth', rateLimit({ windowMs: 900000, limit: options.demo ? 100 : 30 }));
  app.post('/api/auth/demo', async (_req, res) => {
    if (!options.demo) throw fail(404, 'Demo mode is disabled');
    const user = seedUser(randomUUID());
    await store.create(user);
    login(res, user);
    res.status(201).json({ user: publicUser(user) });
  });
  app.use(
    '/api/auth',
    rateLimit({ windowMs: 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }),
  );
  app.use('/api/auth/otp', otpRouter(store, options, login));
  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('nexus_session', { path: '/' });
    res.json({ ok: true });
  });
  const adminEmails = new Set(
    (options.adminEmails ?? [options.adminEmail ?? ''])
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
  const isAdmin = (res: Response) =>
    Boolean(adminEmails.has(current(res).email.toLowerCase()) && res.locals.emailOtp);
  app.use('/api', auth);
  app.use('/api/admin', (_req, res, next) => {
    if (!isAdmin(res))
      return next(fail(403, 'Admin access requires the owner email and email verification.'));
    next();
  });
  app.get('/api/admin/overview', async (req, res) => {
    const query = z
      .object({
        page: z.coerce.number().int().min(1).max(100000).default(1),
        search: z.string().trim().max(100).default(''),
        type: z.enum(['registered', 'demo', 'all']).default('registered'),
      })
      .parse(req.query);
    res.json(await store.adminOverview(query));
  });
  app.use('/api/chats', chatRouter(store));
  app.use('/api/learning', learningRouter(store, options));
  app.use('/api/assessments', assessmentRouter(store));
  app.get('/api/me', (_req, res) => res.json({ user: publicUser(current(res)) }));
  app.patch('/api/me', async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(2).max(80),
        campus: z.string().trim().min(2).max(120),
        languages: z
          .array(z.enum(['Hindi', 'English']))
          .min(1)
          .max(2),
      })
      .parse(req.body);
    await store.mutate(current(res).id, (u) => Object.assign(u, data));
    res.json({ user: publicUser((await store.get(current(res).id))!) });
  });
  app.get('/api/dashboard', (req, res) => {
    const user = current(res);
    const o = opportunity(req.query.opportunityId ?? 'swe-intern');
    res.json({
      user: publicUser(user),
      isAdmin: isAdmin(res),
      opportunity: o,
      opportunities,
      readiness: readiness(user, o),
      gaps: gaps(user, o),
      roadmap: roadmap(user, o),
      peers: recommendations(user, String(req.query.skillId ?? 'docker')),
      balance: user.ledger.reduce((s, e) => s + e.amount, 0),
      mode: { storage: store.mode, payment: options.payment, demo: options.demo },
      challenges,
    });
  });
  app.post('/api/assistant', rateLimit({ windowMs: 60000, limit: 10 }), async (req, res) => {
    const input = z
      .object({ question: z.string().trim().min(3).max(1000), opportunityId: z.string() })
      .parse(req.body);
    res.json(await explain(current(res), opportunity(input.opportunityId), input.question));
  });
  app.get('/api/skills/graph', (_req, res) =>
    res.json({
      nodes: current(res).skills,
      edges: current(res).skills.flatMap((s) =>
        s.related.map((target) => ({ source: s.id, target })),
      ),
    }),
  );
  app.get('/api/opportunities', (_req, res) =>
    res.json({ items: opportunities, total: opportunities.length }),
  );
  app.get('/api/opportunities/:id/readiness', (req, res) =>
    res.json(readiness(current(res), opportunity(req.params.id))),
  );
  app.get('/api/opportunities/:id/gaps', (req, res) =>
    res.json({ items: gaps(current(res), opportunity(req.params.id)) }),
  );
  app.post('/api/opportunities/:id/simulate', (req, res) => {
    const body = z
      .object({
        skillIds: z
          .array(z.enum(['react', 'javascript', 'node', 'git', 'docker', 'testing', 'cicd']))
          .max(7),
      })
      .parse(req.body);
    res.json(simulate(current(res), opportunity(req.params.id), body.skillIds));
  });
  app.get('/api/opportunities/:id/roadmap', (req, res) =>
    res.json(roadmap(current(res), opportunity(req.params.id))),
  );
  app.get('/api/peers', (req, res) => {
    const skill = z
      .enum(['react', 'javascript', 'node', 'git', 'docker', 'testing', 'cicd'])
      .parse(req.query.skillId);
    res.json({ items: recommendations(current(res), skill) });
  });
  app.post('/api/sessions', async (req, res) => {
    const data = z.object({ peerId: z.string(), skillId: z.string() }).parse(req.body);
    const result = await store.mutate(current(res).id, (u) => {
      if (!recommendations(u, data.skillId).some((p) => p.id === data.peerId))
        throw fail(400, 'Choose an eligible peer for this skill');
      const existing = u.sessions.find(
        (s) => s.peerId === data.peerId && s.skillId === data.skillId,
      );
      if (existing) return existing;
      const session = {
        id: randomUUID(),
        ...data,
        status: 'booked' as const,
        createdAt: new Date().toISOString(),
      };
      u.sessions.push(session);
      return session;
    });
    res.status(201).json(result);
  });
  app.post('/api/sessions/:id/complete', async (req, res) => {
    if (!options.demo) throw fail(403, 'Self-completion is available only in the hackathon demo');
    const result = await store.mutate(current(res).id, (u) => {
      const session = u.sessions.find((s) => s.id === req.params.id);
      if (!session) throw fail(404, 'Session not found');
      session.status = 'completed';
      session.completedAt ??= new Date().toISOString();
      return session;
    });
    res.json(result);
  });
  app.get('/api/challenges', (_req, res) => res.json({ items: challenges }));
  app.post('/api/challenges/:id/submit', async (req, res) => {
    const data = z
      .object({ answers: z.array(z.number().int().min(0).max(2)).length(3) })
      .parse(req.body);
    const challenge = challenges.find((c) => c.id === req.params.id);
    if (!challenge) throw fail(404, 'Challenge not found');
    const result = await store.mutate(current(res).id, (u) => {
      if (u.completedChallenges.includes(challenge.id))
        return {
          passed: true,
          alreadyCompleted: true,
          score: readiness(u, opportunities[0]).score,
        };
      if (!u.sessions.some((s) => s.skillId === challenge.skillId && s.status === 'completed'))
        throw fail(409, 'Complete a peer session for this skill first');
      const correct = data.answers.filter((a, i) => a === answerKeys[challenge.id][i]).length;
      if (correct !== 3)
        return {
          passed: false,
          correct,
          total: 3,
          message: 'Review the concepts and try again. No score or credits changed.',
        };
      const skill = u.skills.find((s) => s.id === challenge.skillId)!;
      skill.score = Math.max(skill.score, 60);
      skill.confidence = Math.max(skill.confidence, 0.65);
      skill.evidence.push(challenge.title);
      u.factors.evidence = Math.min(100, u.factors.evidence + 2);
      u.completedChallenges.push(challenge.id);
      const now = new Date().toISOString();
      u.evidence.push({
        id: randomUUID(),
        skillId: skill.id,
        type: 'knowledge-check',
        title: challenge.title,
        verified: true,
        createdAt: now,
      });
      u.ledger.push({
        id: randomUUID(),
        amount: challenge.reward,
        reason: challenge.title,
        reference: challenge.id,
        createdAt: now,
      });
      const score = readiness(u, opportunities[0]).score;
      u.snapshots.push({ score, at: now, reason: `${skill.name} knowledge check passed` });
      return { passed: true, alreadyCompleted: false, reward: challenge.reward, score };
    });
    res.json(result);
  });
  app.get('/api/credits', (_req, res) =>
    res.json({
      items: current(res).ledger,
      balance: current(res).ledger.reduce((s, e) => s + e.amount, 0),
    }),
  );
  app.post('/api/demo/reset', async (_req, res) => {
    if (!options.demo || !current(res).email.endsWith('@demo.nexus.local'))
      throw fail(403, 'Only demo accounts can reset');
    await store.mutate(current(res).id, (u) =>
      Object.assign(u, seedUser(u.id), { learningPremium: null }),
    );
    res.json({ ok: true });
  });
  app.post('/api/agents/explain', async (req, res) => {
    const o = opportunity(z.object({ opportunityId: z.string() }).parse(req.body).opportunityId);
    res.json(await explain(current(res), o));
  });
  // Validate the selected resource before any payment middleware can charge for it.
  app.use('/api/premium/deep-readiness-analysis', (req, res, next) => {
    try {
      res.locals.opportunity = opportunity(
        z.object({ opportunityId: z.string() }).parse(req.body).opportunityId,
      );
      next();
    } catch (e) {
      next(e);
    }
  });
  if (options.payment === 'testnet') app.use(testnetMiddleware());
  app.post('/api/premium/deep-readiness-analysis', async (req, res) => {
    if (options.payment === 'disabled')
      throw fail(503, 'Premium payments are disabled in this preview');
    const user = current(res);
    const o = res.locals.opportunity as Opportunity;
    if (options.payment === 'testnet') {
      res.json({
        ...(await explain(user, o)),
        payment: {
          mode: 'testnet',
          settlement: 'See PAYMENT-RESPONSE header from x402 middleware',
        },
        details: ['Evidence audit', 'Ranked learning priorities', 'Peer-assisted roadmap'],
      });
      return;
    }
    const supplied = req.get('X-Demo-Payment');
    const paid = user.payments.find(
      (p) =>
        p.id === supplied &&
        p.status === 'settled' &&
        p.opportunityId === o.id &&
        new Date(p.expiresAt).getTime() > Date.now(),
    );
    if (!paid) {
      const payment = await store.mutate(user.id, (u) => {
        const existing = u.payments.find(
          (p) =>
            p.opportunityId === o.id &&
            p.status === 'required' &&
            new Date(p.expiresAt).getTime() > Date.now(),
        );
        if (existing) return existing;
        const p = {
          id: randomUUID(),
          mode: 'sandbox' as const,
          status: 'required' as const,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          opportunityId: o.id,
        };
        u.payments.push(p);
        return p;
      });
      res.status(402).json({
        error: {
          code: 'PAYMENT_REQUIRED',
          message: 'Sandbox payment required. No real funds or blockchain transaction.',
        },
        payment,
        price: '0.005 Testnet USDC (simulated)',
        mode: 'sandbox',
      });
      return;
    }
    res.json({
      ...(await explain(user, o)),
      payment: paid,
      details: ['Evidence audit', 'Ranked learning priorities', 'Peer-assisted roadmap'],
    });
  });
  app.post('/api/payments/:id/sandbox-settle', async (req, res) => {
    if (!options.demo || options.payment !== 'sandbox')
      throw fail(403, 'Sandbox settlement is disabled');
    const result = await store.mutate(current(res).id, (u) => {
      const p = u.payments.find((p) => p.id === req.params.id);
      if (!p) throw fail(404, 'Payment not found');
      if (new Date(p.expiresAt).getTime() <= Date.now())
        throw fail(410, 'Payment expired; request a new analysis');
      p.status = 'settled';
      return p;
    });
    res.json(result);
  });
  app.use('/api', (_req, _res, next) => next(fail(404, 'API route not found')));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = error as Error & { status?: number; code?: number };
    const status = error instanceof ZodError ? 400 : e.code === 11000 ? 409 : (e.status ?? 500);
    res.status(status).json({
      error: {
        code:
          status === 400 ? 'VALIDATION_ERROR' : status === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED',
        message:
          status >= 500
            ? 'Something went wrong. Please retry.'
            : error instanceof ZodError
              ? 'Invalid request. Check the required fields.'
              : e.message,
      },
    });
  });
  return app;
}
