import type { Gap, Match, Opportunity, Readiness, Roadmap, UserState } from '@nexus/shared';
import { peers } from './catalog.js';
export const SCORE_VERSION = 'readiness-v1';
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function readiness(user: UserState, opportunity: Opportunity): Readiness {
  const total = opportunity.requirements.reduce((s, r) => s + r.weight, 0);
  const skillMatch = total
    ? (opportunity.requirements.reduce(
        (sum, r) =>
          sum +
          Math.min(1, (user.skills.find((s) => s.id === r.skillId)?.score ?? 0) / r.target) *
            r.weight,
        0,
      ) /
        total) *
      100
    : 0;
  const factors = { skillMatch, ...user.factors };
  const contributions = {
    skillMatch: skillMatch * 0.4,
    evidence: factors.evidence * 0.2,
    experience: factors.experience * 0.15,
    projects: factors.projects * 0.15,
    activity: factors.activity * 0.1,
  };
  const score = Math.round(clamp(Object.values(contributions).reduce((a, b) => a + b, 0)));
  return {
    score,
    version: SCORE_VERSION,
    factors,
    contributions,
    explanation: `Your readiness is ${score}%. Required skill coverage contributes ${contributions.skillMatch.toFixed(1)} points; evidence, experience, projects and recent activity contribute the remaining ${(score - contributions.skillMatch).toFixed(1)}. This measures preparation, not hiring probability.`,
  };
}
export function gaps(user: UserState, opportunity: Opportunity): Gap[] {
  return opportunity.requirements
    .flatMap((r) => {
      const skill = user.skills.find((s) => s.id === r.skillId);
      const current = skill?.score ?? 0;
      return current >= r.target
        ? []
        : [
            {
              skillId: r.skillId,
              name: skill?.name ?? r.skillId,
              current,
              target: r.target,
              severity: current === 0 ? ('missing' as const) : ('weak' as const),
              impact: Number(((1 - current / r.target) * r.weight * 0.4).toFixed(1)),
            },
          ];
    })
    .sort((a, b) => b.impact - a.impact);
}
export function recommendations(user: UserState, skillId: string): Match[] {
  const learner = user.skills.find((s) => s.id === skillId)?.score ?? 0;
  return peers
    .filter((p) => (p.skills[skillId] ?? 0) >= Math.max(60, learner + 15))
    .map((p) => {
      const distance = p.skills[skillId] - learner;
      const swap =
        p.wants.find((id) => (user.skills.find((s) => s.id === id)?.score ?? 0) >= 70) ?? null;
      const active =
        p.activeLearners +
        user.sessions.filter((s) => s.peerId === p.id && s.status === 'booked').length;
      const breakdown = {
        expertise: p.skills[skillId] * 0.28,
        teaching: p.teaching * 0.18,
        availability: p.availability * 0.15,
        reliability: p.reliability * 0.12,
        campus: (p.campus === user.campus ? 100 : 40) * 0.08,
        language: (p.languages.some((l) => user.languages.includes(l)) ? 100 : 0) * 0.07,
        level: Math.max(30, 100 - Math.abs(distance - 40)) * 0.07,
        reciprocity: (swap ? 100 : 20) * 0.05,
        loadPenalty: -Math.max(0, active - 2) * 2,
      };
      return {
        ...p,
        swap,
        breakdown,
        match: Math.round(clamp(Object.values(breakdown).reduce((a, b) => a + b, 0))),
        reasons: [
          `${p.skills[skillId]}/100 expertise · ${p.teaching}/100 teaching`,
          p.campus === user.campus ? 'On your campus' : 'Cross-campus peer',
          `${p.languages.join(' + ')} · ${p.completed} completed sessions`,
          swap
            ? `Skill swap: share your ${user.skills.find((s) => s.id === swap)?.name} knowledge`
            : 'Practical, project-based learning',
        ],
      };
    })
    .sort((a, b) => b.match - a.match || a.id.localeCompare(b.id));
}
export function simulate(user: UserState, opportunity: Opportunity, skillIds: string[]) {
  const copy = structuredClone(user);
  for (const id of new Set(skillIds)) {
    const skill = copy.skills.find((s) => s.id === id);
    const req = opportunity.requirements.find((r) => r.skillId === id);
    if (skill && req && skill.score < req.target) {
      skill.score = req.target;
      copy.factors.evidence = clamp(copy.factors.evidence + 2);
    }
  }
  return {
    current: readiness(user, opportunity).score,
    projected: readiness(copy, opportunity).score,
    skillIds: [...new Set(skillIds)],
    hypothetical: true,
  };
}
export function roadmap(user: UserState, opportunity: Opportunity): Roadmap {
  const remaining = gaps(user, opportunity);
  // Foundation before delivery: Docker and testing precede CI/CD.
  const ordered = [...remaining].sort(
    (a, b) =>
      (({ docker: 0, testing: 1, cicd: 2 })[a.skillId] ?? 3) -
        ({ docker: 0, testing: 1, cicd: 2 }[b.skillId] ?? 3) || b.impact - a.impact,
  );
  const selected: string[] = [];
  const steps = ordered.map((g, i) => {
    selected.push(g.skillId);
    return {
      skillId: g.skillId,
      title: `${g.name} foundations`,
      days: g.skillId === 'cicd' ? 3 : 4,
      outcome:
        (
          {
            docker: 'Build and run a containerized Node service',
            testing: 'Test API validation and failure cases',
            cicd: 'Build a pipeline that gates deployment on passing checks',
          } as Record<string, string>
        )[g.skillId] ?? `Build evidence for ${g.name}`,
      status: i === 0 ? ('next' as const) : ('upcoming' as const),
      peerId: recommendations(user, g.skillId)[0]?.id,
      projectedReadiness: simulate(user, opportunity, selected).projected,
    };
  });
  return {
    target: 90,
    projected: simulate(user, opportunity, selected).projected,
    days: steps.reduce((s, r) => s + r.days, 0),
    peerDays: steps.reduce((s, r) => s + r.days - 1, 0),
    steps,
  };
}
