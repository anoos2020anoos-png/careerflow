import type { Application, Profile, Qualification, Requirement } from '@/types';

/**
 * How a posting's stated requirements line up with what the applicant has.
 *
 * What this is, and what it deliberately is not
 * ---------------------------------------------
 * It is a count: of the things this posting says it wants, how many does the
 * applicant have? That is a fact about two lists, and the user can check every
 * part of it.
 *
 * It is *not* a probability of being hired, and nothing here should be presented
 * as one. Whether an application succeeds depends on the other candidates, the
 * budget, the timing and the person reading the CV — none of which is in this
 * browser. A number like "72% chance" would be invented, and inventing it would
 * make the rest of the app less trustworthy, so the UI reports "4 of 6
 * essential requirements" and stops there.
 */

/** Case- and accent-insensitive, so "Café" and "cafe" are the same word. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Arabic diacritics and tatweel, so "عربيّ" matches "عربي".
    .replace(/[ؐ-ًؚ-ٰٟـ]/g, '')
    .toLowerCase()
    .trim();
}

/** Splits into comparable words, dropping punctuation and one-letter noise. */
function words(value: string): string[] {
  return normalize(value)
    .split(/[^\p{L}\p{N}+#.]+/u)
    .filter((word) => word.length > 1);
}

/**
 * Whether a qualification plausibly answers a requirement.
 *
 * Deliberately conservative: it is only a suggestion for the initial tick, and a
 * false positive is worse than a false negative here — a wrongly pre-ticked box
 * is a claim the user did not make. So it matches only when one side's words are
 * wholly contained in the other's ("React" against "React and TypeScript"),
 * never on a single word shared between two otherwise unrelated phrases.
 */
export function qualificationAnswers(
  qualification: Qualification,
  requirementLabel: string,
): boolean {
  const have = words(qualification.label);
  const want = words(requirementLabel);
  if (have.length === 0 || want.length === 0) return false;

  const haveSet = new Set(have);
  const wantSet = new Set(want);

  const everyWantedWordHeld = want.every((word) => haveSet.has(word));
  const everyHeldWordWanted = have.every((word) => wantSet.has(word));

  return everyWantedWordHeld || everyHeldWordWanted;
}

/** The first qualification that plausibly answers this requirement, if any. */
export function suggestQualification(
  profile: Profile,
  requirementLabel: string,
): Qualification | undefined {
  return profile.qualifications.find((qualification) =>
    qualificationAnswers(qualification, requirementLabel),
  );
}

export interface MatchSummary {
  essentialTotal: number;
  essentialMet: number;
  preferredTotal: number;
  preferredMet: number;
  total: number;
  met: number;
  /** True only when the posting's requirements have been filled in at all. */
  hasRequirements: boolean;
  /** True when every requirement marked essential is ticked. */
  meetsEveryEssential: boolean;
}

export function summarizeMatch(requirements: Requirement[]): MatchSummary {
  let essentialTotal = 0;
  let essentialMet = 0;
  let preferredTotal = 0;
  let preferredMet = 0;

  for (const requirement of requirements) {
    if (requirement.importance === 'essential') {
      essentialTotal += 1;
      if (requirement.met) essentialMet += 1;
    } else {
      preferredTotal += 1;
      if (requirement.met) preferredMet += 1;
    }
  }

  return {
    essentialTotal,
    essentialMet,
    preferredTotal,
    preferredMet,
    total: essentialTotal + preferredTotal,
    met: essentialMet + preferredMet,
    hasRequirements: requirements.length > 0,
    // Vacuously true with no essential requirements listed, which is why the
    // filter that uses this also requires `hasRequirements`.
    meetsEveryEssential: essentialMet === essentialTotal,
  };
}

export function matchFor(application: Application): MatchSummary {
  return summarizeMatch(application.requirements);
}

/**
 * The share of *stated* requirements met, 0-100, or `null` when none are listed.
 *
 * The name says what it measures. It is a proportion of a list the user typed in
 * themselves, not a chance of success.
 */
export function requirementsMetPercentage(summary: MatchSummary): number | null {
  if (summary.total === 0) return null;
  return Math.round((summary.met / summary.total) * 100);
}
