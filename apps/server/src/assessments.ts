import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { UserState, AssessmentAttempt, AssessmentResult } from '@nexus/shared';
import { Store } from './store.js';
import { assessmentBank } from './assessment-bank.js';
import { learningCourses } from './learning.js';
import { readiness } from './engines.js';
import { opportunities } from './catalog.js';
const version = 'foundation-v1';
const fail = (status: number, message: string) => Object.assign(Error(message), { status });
const course = (id: string) => {
  const c = learningCourses.find((c) => c.skillId === id && c.level === 'Beginner');
  if (!c || !Object.hasOwn(assessmentBank, id)) throw fail(404, 'Assessment not found');
  return c;
};
function result(a: AssessmentAttempt, u: UserState): AssessmentResult {
  if (!a.submittedAt || !a.answers) throw fail(409, 'Submit this assessment to see results');
  if (a.version !== version) throw fail(409, 'This assessment version is no longer available');
  const c = course(a.skillId),
    items = assessmentBank[a.skillId];
  const review = items.map((q, i) => ({
    ...q,
    selected: a.answers![i],
    correct: a.answers![i] === q.answer,
  }));
  return {
    attempt: a,
    name: c.skillName,
    band:
      (a.score ?? 0) >= 75
        ? 'Foundation ready'
        : (a.score ?? 0) >= 50
          ? 'Developing foundations'
          : 'Start with the basics',
    review,
    nextSteps: review
      .filter((q) => !q.correct)
      .map((q) => ({
        topic: q.topic,
        exercise: `Review: ${q.explanation} Then write your own example and explain why it works.`,
      })),
    courseId: c.id,
    readiness: readiness(u, opportunities[0]).score,
  };
}
export function assessmentRouter(store: Store) {
  const router = Router();
  router.use(rateLimit({ windowMs: 60000, limit: 60 }));
  router.get('/', (_req, res) => {
    const u = res.locals.user as UserState;
    res.json({
      items: Object.keys(assessmentBank).map((skillId) => {
        const c = course(skillId);
        return {
          skillId,
          name: c.skillName,
          category: c.category,
          questions: assessmentBank[skillId].length,
          latest:
            [...(u.assessments ?? [])]
              .reverse()
              .find((a) => a.skillId === skillId && a.submittedAt) ?? null,
        };
      }),
      history: [...(u.assessments ?? [])].reverse().filter((a) => a.submittedAt),
    });
  });
  router.post('/:skillId/start', async (req, res) => {
    const c = course(String(req.params.skillId));
    const attempt = await store.mutate(res.locals.user.id, (u) => {
      u.assessments ??= [];
      const active = u.assessments.find(
        (a) =>
          a.skillId === c.skillId &&
          !a.submittedAt &&
          Date.parse(a.expiresAt) > Date.now() &&
          a.version === version,
      );
      if (active) return active;
      const latest = [...u.assessments]
        .reverse()
        .find((a) => a.skillId === c.skillId && a.submittedAt);
      if (latest && Date.now() - Date.parse(latest.submittedAt!) < 60000)
        throw fail(429, 'Review your feedback for a minute before trying again.');
      const now = new Date();
      const a: AssessmentAttempt = {
        id: randomUUID(),
        skillId: c.skillId,
        version,
        startedAt: now.toISOString(),
        expiresAt: new Date(+now + 30 * 60000).toISOString(),
      };
      u.assessments = u.assessments
        .filter((a) => a.submittedAt || Date.parse(a.expiresAt) > Date.now())
        .slice(-59);
      u.assessments.push(a);
      return a;
    });
    res.json({
      attempt,
      name: c.skillName,
      questions: assessmentBank[c.skillId].map(({ answer, explanation, ...q }) => q),
    });
  });
  router.get('/attempts/:id', (req, res) => {
    const u = res.locals.user as UserState,
      a = u.assessments?.find((a) => a.id === req.params.id);
    if (!a) throw fail(404, 'Assessment attempt not found');
    res.json(result(a, u));
  });
  router.post('/attempts/:id/submit', async (req, res) => {
    const input = z
      .object({ answers: z.array(z.number().int().min(0).max(2)).length(4) })
      .strict()
      .parse(req.body);
    const report = await store.mutate(res.locals.user.id, (u) => {
      const a = u.assessments?.find((a) => a.id === req.params.id);
      if (!a) throw fail(404, 'Assessment attempt not found');
      if (a.submittedAt) {
        if (JSON.stringify(a.answers) !== JSON.stringify(input.answers))
          throw fail(409, 'This assessment was already submitted with different answers');
        return result(a, u);
      }
      if (Date.parse(a.expiresAt) <= Date.now())
        throw fail(410, 'Assessment expired. Start a new attempt.');
      if (a.version !== version) throw fail(409, 'Assessment changed. Start a new attempt.');
      const c = course(a.skillId),
        items = assessmentBank[a.skillId];
      const correct = items.filter((q, i) => q.answer === input.answers[i]).length;
      a.score = Math.round((correct / items.length) * 100);
      a.answers = input.answers;
      a.submittedAt = new Date().toISOString();
      let skill = u.skills.find((s) => s.id === a.skillId);
      if (!skill) {
        skill = {
          id: a.skillId,
          name: c.skillName,
          score: 0,
          confidence: 0,
          evidence: [],
          related: [],
        };
        u.skills.push(skill);
      }
      a.profileBefore = skill.score;
      skill.score = Math.max(skill.score, Math.round(a.score * 0.6));
      a.profileAfter = skill.score;
      // A short repeatable quiz is knowledge practice, not verified evidence or paid work.
      if (skill.score > a.profileBefore) skill.confidence = Math.max(skill.confidence, 0.35);
      if (skill.score !== a.profileBefore)
        u.snapshots.push({
          score: readiness(u, opportunities[0]).score,
          at: a.submittedAt,
          reason: `${c.skillName} foundation assessment`,
        });
      return result(a, u);
    });
    res.json(report);
  });
  return router;
}
