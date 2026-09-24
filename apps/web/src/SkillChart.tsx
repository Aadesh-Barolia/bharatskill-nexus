import type { Skill } from '@nexus/shared';
export default function SkillChart({
  skills,
  selected,
  onSelect,
}: {
  skills: Skill[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="skill-bar-chart" aria-label="Your skill scores">
      <div className="chart-scale">
        <span>SKILL</span>
        <span>PROFICIENCY / 100</span>
      </div>
      {skills.map((skill) => (
        <button
          key={skill.id}
          className={`skill-bar-row ${selected === skill.id ? 'selected' : ''} ${skill.score < 60 ? 'needs-practice' : ''}`}
          aria-label={`Inspect ${skill.name} skill`}
          aria-pressed={selected === skill.id}
          onClick={() => onSelect(skill.id)}
        >
          <span>{skill.name}</span>
          <span className="skill-bar-track">
            <i style={{ width: `${Math.min(100, Math.max(0, skill.score))}%` }} />
          </span>
          <strong>{skill.score}</strong>
          <small>
            {skill.score >= 60 ? 'Established' : skill.score === 0 ? 'Not started' : 'Practice'}
          </small>
        </button>
      ))}
      <p className="chart-caption">
        Select a skill to see its evidence below. Scores reflect recorded progress.
      </p>
    </div>
  );
}
