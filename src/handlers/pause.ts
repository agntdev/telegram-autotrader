import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, confirmKeyboard } from "../toolkit/index.js";
import {
  getActiveAccount,
  getOrCreateStrategy,
  setStrategyActive,
  audit,
} from "../store.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

const PAUSE_TEXT =
  "⏸ Pause trading?\n\n" +
  "No new orders will be placed while trading is paused.\n" +
  "Existing positions will remain open.";

const DONE_TEXT =
  "Trading paused. No new orders will be placed.\n\n" +
  "Tap Resume to restart trading.";

const ALREADY_PAUSED_TEXT =
  "Trading is already paused.\n\n" +
  "Tap Resume to restart trading.";

composer.command("pause", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  const acct = getActiveAccount(userId);
  if (!acct) {
    await ctx.reply("No linked account. Connect one first.", { reply_markup: backToMenu });
    return;
  }
  const strat = getOrCreateStrategy(userId);
  if (!strat.active) {
    await ctx.reply(ALREADY_PAUSED_TEXT, { reply_markup: backToMenu });
    return;
  }
  ctx.session.step = "pause:confirm";
  await ctx.reply(PAUSE_TEXT, {
    reply_markup: confirmKeyboard("pause"),
  });
});

composer.callbackQuery("pause:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const acct = getActiveAccount(userId);
  if (!acct) {
    await ctx.editMessageText("No linked account. Connect one first.", {
      reply_markup: backToMenu,
    });
    return;
  }
  const strat = getOrCreateStrategy(userId);
  if (!strat.active) {
    await ctx.editMessageText(ALREADY_PAUSED_TEXT, { reply_markup: backToMenu });
    return;
  }
  ctx.session.step = "pause:confirm";
  await ctx.editMessageText(PAUSE_TEXT, {
    reply_markup: confirmKeyboard("pause"),
  });
});

composer.callbackQuery("pause:yes", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "pause:confirm") return;
  ctx.session.step = undefined;

  const userId = ctx.from?.id ?? 0;
  setStrategyActive(userId, false);
  audit("trading_paused", userId);

  ctx.session.strategyActive = false;
  await ctx.editMessageText(DONE_TEXT, { reply_markup: backToMenu });
});

composer.callbackQuery("pause:no", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "pause:confirm") return;
  ctx.session.step = undefined;
  await ctx.editMessageText("Pause cancelled.", { reply_markup: backToMenu });
});

export default composer;
