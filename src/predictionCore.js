// The one function everything depends on. Keep it pure (no DB calls, no
// side effects) so it can run identically in the bot, the Mini App, and
// the scheduled job.

const MATCH_MARGIN = 15; // placeholder — confirm with product owner

export function roughEstimateFromCapacity(university) {
  // placeholder for year 1, before historical_cutoffs has real data.
  // smaller capacity => generally more competitive => higher assumed cutoff
  if (university.total_seats < 500) return 550;
  if (university.total_seats < 2000) return 480;
  return 420;
}

/**
 * @param {number} score - estimated or official
 * @param {Array<{id: string, name: string, total_seats: number, cutoff?: number}>} rankedUniversities
 *   - each item must already carry its latest historical_cutoffs value (or
 *     undefined if none exists yet) plus total_seats for the fallback.
 * @returns {Array<{university: object, tag: 'safety'|'match'|'reach', cutoff_used: number}>}
 */
export function predictOutcome(score, rankedUniversities) {
  return rankedUniversities.map((university) => {
    const cutoff =
      university.cutoff ?? roughEstimateFromCapacity(university);
    const difference = score - cutoff;

    let tag;
    if (difference > MATCH_MARGIN) tag = 'safety';
    else if (difference >= -MATCH_MARGIN) tag = 'match';
    else tag = 'reach';

    return { university, tag, cutoff_used: cutoff };
  });
}
