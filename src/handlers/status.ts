import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import {
  getActiveAccount,
  getOrCreateStrategy,
} from "../store.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function buildStatus(userId: number): string {
  const acct = getActiveAccount(userId);
  const strat = getOrCreateStrategy(userId);

  if (!acct) {
    return (
      "📊 Account Status\n\n" +
      "No linked account.\n\n" +
      "Tap Connect to link your brokerage account."
    );
  }

  const tradingLine = strat.active ? "Active" : "Inactive";
  const stratLine = [
    `Risk level: ${strat.params.riskLevel}`,
    `Max position: ${strat.params.maxPositionSizePct}%`,
    `Drawdown limit: ${strat.params.drawdownThresholdPct}%`,
  ].join("\n");

  return (
    `📊 Account Status\n\n` +
    `Exchange: ${acct.exchange}\n` +
    `Account: ${acct.maskedAccountId}\n` +
    `Status: ${acct.status}\n\n` +
    `Trading: ${tradingLine}\n` +
    stratLine
  );
}

composer.command("status", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  await ctx.reply(buildStatus(userId), { reply_markup: backToMenu });
});

composer.callbackQuery("status:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  await ctx.editMessageText(buildStatus(userId), { reply_markup: backToMenu });
});

export default composer;
