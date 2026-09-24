import { Router, type Response } from 'express';
import { randomInt, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import type { UserState } from '@nexus/shared';
import { Store } from './store.js';
import { seedUser } from './catalog.js';
import {smtpConfigured,smtpSettings,sendOtp} from './mail.js';
type Challenge = {
  id: string;
  email: string;
  name: string;
  digest: string;
  expiresAt: Date;
  resendAt: Date;
  attempts: number;
  delivery: string;
};
const schema = new Schema<Challenge>({
  id: String,
  email: { type: String, unique: true },
  name: String,
  digest: String,
  expiresAt: Date,
  resendAt: Date,
  attempts: Number,
  delivery: String,
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OtpModel = mongoose.model<Challenge>('EmailOtp', schema);
const local = new WeakMap<Store, Map<string, Challenge>>();
const fail = (status: number, message: string) => Object.assign(Error(message), { status });
export function otpRouter(
  store: Store,
  options: {
    secret: string;
    demo: boolean;
    origin: string;
    otpDelivery?: (email: string, code: string) => Promise<void>;
  },
  login: (res: Response, u: UserState, method: string) => void,
) {
  const router = Router();
  if (!local.has(store)) local.set(store, new Map());
  const memory = local.get(store)!;
  const preview =
    options.demo &&
    process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1'].includes(new URL(options.origin).hostname) &&
    !smtpConfigured();
  const digest = (id: string, email: string, code: string) =>
    createHmac('sha256', options.secret).update(`${id}:${email}:${code}`).digest('hex');
  router.post('/request', async (req, res) => {
    if (
      preview &&
      !options.otpDelivery &&
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip ?? '')
    )
      throw fail(503, 'Local code preview is only available on this computer');
    const input = z
      .object({
        email: z
          .email()
          .trim()
          .max(254)
          .transform((s) => s.toLowerCase()),
        name: z.string().trim().min(2).max(80).optional(),
      })
      .parse(req.body);
    if (input.email.endsWith('@demo.nexus.local')) throw fail(400, 'Use a real email address');
    if (!options.otpDelivery && !preview) {
      try { smtpSettings(); } catch { throw fail(503, 'Email sign-in is not configured yet. Please try again later.'); }
    }
    const code = String(randomInt(0, 1000000)).padStart(6, '0'),
      id = randomUUID(),
      now = new Date();
    const c: Challenge = {
      id,
      email: input.email,
      name: input.name ?? 'Learner',
      digest: digest(id, input.email, code),
      expiresAt: new Date(+now + 600000),
      resendAt: new Date(+now + 60000),
      attempts: 5,
      delivery: preview && !options.otpDelivery ? 'local-preview' : 'email',
    };
    if (store.mode === 'mongo') {
      await OtpModel.init();
      try {
        await OtpModel.findOneAndUpdate(
          { email: input.email, resendAt: { $lte: now } },
          { $set: c },
          { upsert: true },
        );
      } catch (e) {
        if ((e as { code?: number }).code === 11000)
          throw fail(429, 'Please wait 60 seconds before requesting another code');
        throw e;
      }
    } else {
      for (const [email, entry] of memory) if (+entry.expiresAt < +now) memory.delete(email);
      if (+(memory.get(input.email)?.resendAt ?? 0) > +now)
        throw fail(429, 'Please wait 60 seconds before requesting another code');
      memory.set(input.email, c);
    }
    try {
      if (options.otpDelivery) await options.otpDelivery(input.email, code);
      else if (!preview) await sendOtp(input.email, code);
    } catch {
      if (store.mode === 'mongo') await OtpModel.deleteOne({ id });
      else if (memory.get(input.email)?.id === id) memory.delete(input.email);
      throw fail(503, 'Unable to send the code. Please try again shortly.');
    }
    res.json({
      requestId: id,
      expiresIn: 600,
      resendAfter: 60,
      delivery: preview && !options.otpDelivery ? 'local-preview' : 'email',
      ...(preview && !options.otpDelivery ? { previewCode: code } : {}),
    });
  });
  router.post('/verify', async (req, res) => {
    const input = z
      .object({
        requestId: z.uuid(),
        email: z
          .email()
          .trim()
          .max(254)
          .transform((s) => s.toLowerCase()),
        code: z.string().regex(/^\d{6}$/),
      })
      .parse(req.body);
    const now = new Date();
    let c: Challenge | null | undefined;
    if (store.mode === 'mongo')
      c = await OtpModel.findOneAndUpdate(
        { id: input.requestId, email: input.email, expiresAt: { $gt: now }, attempts: { $gt: 0 } },
        { $inc: { attempts: -1 } },
        { new: false },
      ).lean();
    else {
      c = memory.get(input.email);
      if (!c || c.id !== input.requestId || +c.expiresAt <= +now || c.attempts <= 0) c = null;
      else c.attempts--;
    }
    if (
      !c ||
      !timingSafeEqual(
        Buffer.from(c.digest, 'hex'),
        Buffer.from(digest(input.requestId, input.email, input.code), 'hex'),
      )
    )
      throw fail(401, 'Invalid or expired code. Request a new code if needed.');
    // Only one simultaneous verification may consume a challenge.
    if (store.mode === 'mongo') {
      const consumed = await OtpModel.updateOne(
        { id: c.id, digest: c.digest },
        { $set: { digest: '', attempts: 0 } },
      );
      if (!consumed.modifiedCount) throw fail(401, 'This code has already been used');
    } else {
      if (memory.get(c.email)?.digest !== c.digest || !c.digest)
        throw fail(401, 'This code has already been used');
      c.digest = '';
      c.attempts = 0;
    }
    let user = await store.byEmail(c.email);
    if (!user) {
      const fresh = seedUser(randomUUID(), c.name, c.email);
      fresh.skills = fresh.skills.map((s) => ({ ...s, score: 0, confidence: 0, evidence: [] }));
      fresh.factors = { evidence: 0, experience: 0, projects: 0, activity: 0 };
      fresh.ledger = [];
      fresh.snapshots = [];
      try {
        await store.create(fresh);
        user = fresh;
      } catch (e) {
        user = await store.byEmail(c.email);
        if (!user) throw e;
      }
    }
    login(res, user, c.delivery === 'email' ? 'email_otp' : 'preview_otp');
    res.json({ ok: true });
  });
  return router;
}
