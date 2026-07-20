import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import {
  getActiveAccount,
  getOrCreateStrategy,
  setStrategyActive,
  audit,
} from "../store.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

const RESUMED_TEXT =
  "Trading resumed. Orders will be placed based on your strategy settings.";

const ALREADY_ACTIVE_TEXT =
  "Trading is already active.";

composer.command("resume", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  const acct = getActiveAccount(userId);
  if (!acct) {
    await ctx.reply("No linked account. Connect one first.", { reply_markup: backToMenu });
    return;
  }
  const strat = getOrCreateStrategy(userId);
  if (strat.active) {
    await ctx.reply(ALREADY_ACTIVE_TEXT, { reply_markup: backToMenu });
    return;
  }
  setStrategyActive(userId, true);
  audit("trading_resumed", userId);
  ctx.session.strategyActive = true;
  await ctx.reply(RESUMED_TEXT, { reply_markup: backToMenu });
});

composer.callbackQuery("resume:show", async (ctx) => {
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
  if (strat.active) {
    await ctx.editMessageText(ALREADY_ACTIVE_TEXT, { reply_markup: backToMenu });
    return;
  }
  setStrategyActive(userId, true);
  audit("trading_resumed", userId);
  ctx.session.strategyActive = true;
  await ctx.editMessageText(RESUMED_TEXT, { reply_markup: backToMenu });
});

export default composer;
