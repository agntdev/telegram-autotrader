import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getOrCreateStrategy, getActiveAccount } from "../store.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function buildPerformance(userId: number): string {
  const acct = getActiveAccount(userId);
  if (!acct) {
    return (
      "📈 Performance\n\n" +
      "No linked account.\n\n" +
      "Connect your brokerage to see performance metrics."
    );
  }

  const strat = getOrCreateStrategy(userId);

  if (strat.metrics.totalTrades === 0) {
    return (
      "📈 Performance\n\n" +
      "No trades yet.\n\n" +
      "Activate trading to start building your track record."
    );
  }

  return (
    `📈 Performance\n\n` +
    `Total return: ${strat.metrics.totalReturnPct >= 0 ? "+" : ""}${strat.metrics.totalReturnPct.toFixed(1)}%\n` +
    `Win rate: ${(strat.metrics.winRate * 100).toFixed(0)}%\n` +
    `Total trades: ${strat.metrics.totalTrades}\n` +
    `Sharpe ratio: ${strat.metrics.sharpeRatio.toFixed(2)}`
  );
}

composer.command("performance", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  await ctx.reply(buildPerformance(userId), { reply_markup: backToMenu });
});

composer.callbackQuery("performance:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  await ctx.editMessageText(buildPerformance(userId), { reply_markup: backToMenu });
});

export default composer;
