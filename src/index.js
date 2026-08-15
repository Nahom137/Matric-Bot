import { Telegraf, Markup } from 'telegraf';
import 'dotenv/config';
import { supabase } from './supabase.js';
import { registerBrowse } from './browse.js';
import { registerPredict } from './predict.js';
import { registerWait } from './wait.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const mainMenu = Markup.keyboard([
  ['🏫 Browse universities'],
  ['🎯 Predict my placement'],
  ['⏳ Wait for my result'],
]).resize();

// Ensure a student row exists for this telegram user (does NOT ask for
// name/reg-number yet — that only happens in REGISTER, shared by
// Predict and Wait for Result).
async function ensureStudent(ctx) {
  const telegram_id = ctx.from.id;
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('telegram_id', telegram_id)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('students')
    .insert({ telegram_id })
    .select('id')
    .single();

  if (error) throw error;
  return created;
}

bot.start(async (ctx) => {
  await ensureStudent(ctx);
  await ctx.reply(
    "Welcome! What would you like to do?",
    mainMenu
  );
});

bot.hears('🏫 Browse universities', (ctx) => ctx.reply('Opening Browse...'));
bot.hears('🎯 Predict my placement', (ctx) =>
  ctx.reply(
    'Predict my placement',
    Markup.inlineKeyboard([
      Markup.button.webApp('Open', `${process.env.MINI_APP_URL}/predict`),
    ])
  )
);
bot.hears('⏳ Wait for my result', (ctx) =>
  ctx.reply(
    'Wait for my result',
    Markup.inlineKeyboard([
      Markup.button.webApp('Open', `${process.env.MINI_APP_URL}/wait`),
    ])
  )
);

registerBrowse(bot, supabase);
registerPredict(bot, supabase);
registerWait(bot, supabase);

bot.launch();
console.log('Matric Bot is running.');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
