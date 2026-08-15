import { Markup } from 'telegraf';

export function registerBrowse(bot, supabase) {
  bot.action('browse:regions', async (ctx) => {
    const { data: regions } = await supabase
      .from('universities')
      .select('region')
      .neq('region', null);
    const unique = [...new Set(regions.map((r) => r.region))];
    await ctx.editMessageText(
      'Pick a region:',
      Markup.inlineKeyboard(
        unique.map((r) => [Markup.button.callback(r, `browse:region:${r}`)])
      )
    );
  });

  bot.action(/^browse:region:(.+)$/, async (ctx) => {
    const region = ctx.match[1];
    const { data: universities } = await supabase
      .from('universities')
      .select('id, name')
      .eq('region', region);
    await ctx.editMessageText(
      `Universities in ${region}:`,
      Markup.inlineKeyboard(
        universities.map((u) => [
          Markup.button.callback(u.name, `browse:uni:${u.id}`),
        ])
      )
    );
  });

  bot.action(/^browse:uni:(.+)$/, async (ctx) => {
    const universityId = ctx.match[1];

    const [{ data: uni }, { data: capacity }, { data: departments }] =
      await Promise.all([
        supabase
          .from('universities')
          .select('*')
          .eq('id', universityId)
          .single(),
        supabase
          .from('university_capacity')
          .select('*')
          .eq('university_id', universityId)
          .order('year', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('departments')
          .select('name, field')
          .eq('university_id', universityId),
      ]);

    const deptList = departments.length
      ? departments.map((d) => `• ${d.name}`).join('\n')
      : 'No departments listed yet.';

    await ctx.editMessageText(
      `*${uni.name}*\nRegion: ${uni.region}\nSeats (latest): ${
        capacity?.total_seats ?? 'unknown'
      }\n\n*Departments*\n${deptList}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➕ Add to my list', `browse:add:${universityId}`)],
        ]),
      }
    );
  });

  bot.action(/^browse:add:(.+)$/, async (ctx) => {
    const universityId = ctx.match[1];

    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, registration_number')
      .eq('telegram_id', ctx.from.id)
      .single();

    if (!student.full_name || !student.registration_number) {
      // Reuse REGISTER — in the real Mini App this opens the register
      // screen and returns here afterwards.
      await ctx.answerCbQuery('Please register first (name + reg. number).');
      return;
    }

    const { data: existing } = await supabase
      .from('preferences')
      .select('id')
      .eq('student_id', student.id)
      .eq('university_id', universityId)
      .maybeSingle();

    if (existing) {
      await ctx.answerCbQuery('Already on your list.');
      return;
    }

    const { data: maxRank } = await supabase
      .from('preferences')
      .select('rank_order')
      .eq('student_id', student.id)
      .order('rank_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from('preferences').insert({
      student_id: student.id,
      university_id: universityId,
      rank_order: (maxRank?.rank_order ?? 0) + 1,
    });

    await ctx.answerCbQuery('Added to your list ✅');
  });

  bot.hears('🏫 Browse universities', (ctx) =>
    ctx.reply(
      'Browse universities',
      Markup.inlineKeyboard([
        [Markup.button.callback('Pick a region', 'browse:regions')],
      ])
    )
  );
}
