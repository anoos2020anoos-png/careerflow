import { describe, expect, it } from 'vitest';
import {
  matchFor,
  qualificationAnswers,
  requirementsMetPercentage,
  suggestQualification,
  summarizeMatch,
} from '@/lib/match';
import {
  makeApplication,
  makeProfile,
  makeQualification,
  makeRequirement,
} from '@/test/factories';

describe('summarizeMatch', () => {
  it('counts essential and preferred requirements separately', () => {
    const summary = summarizeMatch([
      makeRequirement('React', 'essential', true),
      makeRequirement('TypeScript', 'essential', true),
      makeRequirement('Arabic', 'essential', false),
      makeRequirement('GraphQL', 'preferred', true),
      makeRequirement('Figma', 'preferred', false),
    ]);

    expect(summary.essentialTotal).toBe(3);
    expect(summary.essentialMet).toBe(2);
    expect(summary.preferredTotal).toBe(2);
    expect(summary.preferredMet).toBe(1);
    expect(summary.total).toBe(5);
    expect(summary.met).toBe(3);
  });

  it('reports no requirements rather than a perfect score for an empty list', () => {
    const summary = summarizeMatch([]);
    expect(summary.hasRequirements).toBe(false);
    expect(summary.total).toBe(0);
    expect(requirementsMetPercentage(summary)).toBeNull();
  });

  it('only claims every essential is met when they all are', () => {
    expect(
      summarizeMatch([
        makeRequirement('React', 'essential', true),
        makeRequirement('Figma', 'preferred', false),
      ]).meetsEveryEssential,
    ).toBe(true);

    expect(
      summarizeMatch([
        makeRequirement('React', 'essential', true),
        makeRequirement('Arabic', 'essential', false),
      ]).meetsEveryEssential,
    ).toBe(false);
  });

  it('reads the requirements off an application', () => {
    const application = makeApplication({
      requirements: [makeRequirement('React', 'essential', true)],
    });
    expect(matchFor(application).met).toBe(1);
  });
});

describe('requirementsMetPercentage', () => {
  it('is a share of what the posting asked for, rounded', () => {
    const summary = summarizeMatch([
      makeRequirement('a', 'essential', true),
      makeRequirement('b', 'essential', true),
      makeRequirement('c', 'essential', false),
    ]);
    expect(requirementsMetPercentage(summary)).toBe(67);
  });

  it('is null when nothing has been listed, never zero', () => {
    // Zero would read as "you match none of them", which is a different claim
    // from "you have not written the requirements down yet".
    expect(requirementsMetPercentage(summarizeMatch([]))).toBeNull();
  });
});

describe('qualificationAnswers', () => {
  it('matches when the requirement repeats what the qualification says', () => {
    expect(qualificationAnswers(makeQualification('React'), 'React')).toBe(true);
    expect(qualificationAnswers(makeQualification('React and TypeScript'), 'React')).toBe(true);
    expect(qualificationAnswers(makeQualification('React'), 'React and TypeScript')).toBe(true);
  });

  it('ignores case and accents', () => {
    expect(qualificationAnswers(makeQualification('RÉACT'), 'react')).toBe(true);
  });

  it('ignores Arabic diacritics and tatweel', () => {
    expect(qualificationAnswers(makeQualification('اللغة العربية'), 'اللغـة العربيّة')).toBe(true);
  });

  it('refuses a match on one word shared between unrelated phrases', () => {
    // "Bachelor's degree in English" and "English at business level" share a
    // word and nothing else. Pre-ticking that box would put a claim in the
    // user's mouth that they never made.
    expect(
      qualificationAnswers(
        makeQualification("Bachelor's degree in English literature"),
        'English at business level',
      ),
    ).toBe(false);
  });

  it('refuses a match on an empty or punctuation-only label', () => {
    expect(qualificationAnswers(makeQualification('—'), 'React')).toBe(false);
    expect(qualificationAnswers(makeQualification('React'), '   ')).toBe(false);
  });
});

describe('suggestQualification', () => {
  it('finds the qualification that answers a requirement', () => {
    const profile = makeProfile([
      makeQualification("Bachelor's degree in English literature", 'education'),
      makeQualification('TypeScript'),
    ]);
    expect(suggestQualification(profile, 'TypeScript')?.label).toBe('TypeScript');
  });

  it('returns nothing when the profile has no answer', () => {
    const profile = makeProfile([makeQualification('TypeScript')]);
    expect(suggestQualification(profile, 'Kubernetes')).toBeUndefined();
  });

  it('returns nothing for an empty profile', () => {
    expect(suggestQualification(makeProfile(), 'TypeScript')).toBeUndefined();
  });
});
