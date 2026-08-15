import { predictOutcome } from './predictionCore.js';

export function registerWait(bot, supabase) {
  // The button in index.js opens the Mini App's register screen; once the
  // student confirms there, call this same logic to flip the flag.
  bot.action('wait:confirm', async (ctx) => {
    await supabase
      .from('students')
      .update({ wants_notification: true })
      .eq('telegram_id', ctx.from.id);
    await ctx.reply("We'll message you the moment your result is out.");
  });
}

/**
 * Runs on a schedule (e.g. hourly via cron / a Supabase edge function /
 * node-cron). Not wired to a scheduler here — call this from whatever
 * scheduling mechanism you set up.
 */
export async function checkForResults(bot, supabase, fetchOfficialResult) {
  const { data: waiting } = await supabase
    .from('students')
    .select('*')
    .eq('wants_notification', true)
    .is('official_score', null);

  for (const student of waiting ?? []) {
    const result = await fetchOfficialResult(student.registration_number);
    if (!result) continue;

    await supabase
      .from('students')
      .update({ official_score: result.score })
      .eq('id', student.id);

    await bot.telegram.sendMessage(
      student.telegram_id,
      'Your result is out! Tap here to see it.'
    );

    const { data: prefs } = await supabase
      .from('preferences')
      .select('university_id, rank_order, universities(name, total_seats)')
      .eq('student_id', student.id)
      .order('rank_order');

    if (!prefs?.length) continue;

    // attach latest cutoff per university before calling the pure function
    const withCutoffs = await Promise.all(
      prefs.map(async (p) => {
        const { data: cutoff } = await supabase
          .from('historical_cutoffs')
          .select('min_score_accepted')
          .eq('university_id', p.university_id)
          .order('year', { ascending: false })
          .limit(1)
          .maybeSingle();
        return {
          id: p.university_id,
          name: p.universities.name,
          total_seats: p.universities.total_seats,
          cutoff: cutoff?.min_score_accepted,
        };
      })
    );

    const finalResult = predictOutcome(result.score, withCutoffs);
    const lines = finalResult.map(
      (r) => `${r.university.name}: ${r.tag.toUpperCase()}`
    );

    await bot.telegram.sendMessage(
      student.telegram_id,
      `Based on your real score:\n${lines.join('\n')}`
    );
  }
}
