import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';
import assert from 'node:assert/strict';
const database = await MongoMemoryServer.create({ binary: { version: '8.0.12' } });
const {default:nodemailer}=await import('nodemailer');
const originalCreate=nodemailer.createTransport;
let mailCode='';
nodemailer.createTransport=((..._args:unknown[])=>originalCreate({name:'test-mail',version:'1',send(mail,callback){mailCode=String(mail.data.text).match(/\b\d{6}\b/)![0];callback(null,{accepted:['vercel@example.test'],rejected:[],messageId:'test-only',envelope:{from:'test@example.test',to:['vercel@example.test']}})}})) as typeof originalCreate;
try {
  Object.assign(process.env, {
    STORAGE: 'mongo',
    MONGODB_URI: database.getUri('vercel_preview'),
    DEMO_MODE: 'false',
    PAYMENT_MODE: 'disabled',
    CLIENT_ORIGIN: 'https://nexus.example.test',
    JWT_SECRET: 'serverless-test-only-secret-at-least-32-characters',
    TRUST_PROXY_HOPS: '0',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_USER: 'test-user',
    SMTP_PASS: 'test-only-password',
    EMAIL_FROM: 'test@example.test',
  });
  const { default: handler } = await import('../api/index.ts');
  const wrapper = express();
  wrapper.use(handler);
  await Promise.all([
    request(wrapper).get('/api/health').expect(200),
    request(wrapper).get('/api/health').expect(200),
  ]);
  await request(wrapper).post('/api/auth/demo').expect(404);
  const challenge = (
    await request(wrapper)
      .post('/api/auth/otp/request')
      .send({ name: 'Public Learner', email: 'vercel@example.test' })
      .expect(200)
  ).body;
  assert.equal(challenge.previewCode, undefined);
  const registration = await request(wrapper)
    .post('/api/auth/otp/verify')
    .send({ email: 'vercel@example.test', requestId: challenge.requestId, code: mailCode })
    .expect(200);
  await request(wrapper)
    .post('/api/auth/otp/verify')
    .send({ email: 'vercel@example.test', requestId: challenge.requestId, code: mailCode })
    .expect(401);
  const cookies = registration.headers['set-cookie'] as unknown as string[];
  assert.match(cookies[0], /HttpOnly/);
  assert.match(cookies[0], /Secure/);
  const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
  const d = (await request(wrapper).get('/api/dashboard').set('Cookie', cookie).expect(200)).body;
  assert.equal(d.balance, 0);
  assert.equal(d.readiness.score, 0);
  await request(wrapper)
    .post('/api/learning/public-speaking-beginner/start')
    .set('Cookie', cookie)
    .expect(200);
  await request(wrapper).get('/api/learning/git-advanced').set('Cookie', cookie).expect(403);
  await request(wrapper)
    .post('/api/premium/deep-readiness-analysis')
    .set('Cookie', cookie)
    .send({ opportunityId: 'swe-intern' })
    .expect(503);
  await request(wrapper)
    .post('/api/auth/otp/request')
    .set('Origin', 'https://untrusted.example.test')
    .send({ email: 'vercel@example.test', name: 'Public Learner' })
    .expect(403);
  const { OtpModel } = await import('../apps/server/dist/apps/server/src/otp.js');
  const expired = (
    await request(wrapper)
      .post('/api/auth/otp/request')
      .send({ email: 'expired@example.test' })
      .expect(200)
  ).body;
  const stored = await OtpModel.findOne({ id: expired.requestId }).lean();
  assert.equal(stored?.digest.length, 64);
  assert.notEqual(stored?.digest, mailCode);
  await OtpModel.updateOne(
    { id: expired.requestId },
    { $set: { expiresAt: new Date(Date.now() - 1000) } },
  );
  await request(wrapper)
    .post('/api/auth/otp/verify')
    .send({ email: 'expired@example.test', requestId: expired.requestId, code: mailCode })
    .expect(401);
  await OtpModel.updateOne({ id: challenge.requestId }, { $set: { resendAt: new Date(0) } });
  const resent = (
    await request(wrapper)
      .post('/api/auth/otp/request')
      .send({ email: 'vercel@example.test' })
      .expect(200)
  ).body;
  assert.notEqual(resent.requestId, challenge.requestId);
  const attempts = await Promise.all(
    [1, 2].map(() =>
      request(wrapper)
        .post('/api/auth/otp/verify')
        .send({ email: 'vercel@example.test', requestId: resent.requestId, code: mailCode }),
    ),
  );
  assert.deepEqual(attempts.map((r) => r.status).sort(), [200, 401]);
  console.log(
    'PASS: Vercel adapter initializes Mongo once, registers a real empty account, uses secure cookies, persists skills and disables demo/premium actions. Local adapter test, not a hosted deployment.',
  );
} finally {
  nodemailer.createTransport = originalCreate;
  await mongoose.disconnect();
  await database.stop();
}

