// The bot side just opens the Mini App (see index.js — the webApp button).
// All of Stage 4's register -> preference list -> slider -> result screens
// live in the Mini App codebase (separate web project) and call
// predictionCore.js's predictOutcome() directly, or through a small API
// route backed by Supabase.
//
// Nothing to register on the bot side yet beyond the button in index.js.
export function registerPredict(bot, supabase) {}
