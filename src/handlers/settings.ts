import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getOrCreateStrategy, audit } from "../store.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function buildSettings(userId: number): string {
  const strat = getOrCreateStrategy(userId);
  return (
    `⚙️ Strategy Settings\n\n` +
    `Risk level: ${strat.params.riskLevel}\n` +
    `Max position size: ${strat.params.maxPositionSizePct}%\n` +
    `Drawdown threshold: ${strat.params.drawdownThresholdPct}%\n` +
    `Allowed symbols: ${strat.params.allowedSymbols.join(", ")}\n\n` +
    `Tap a setting below to adjust.`
  );
}

function settingsKeyboard(): ReturnType<typeof inlineKeyboard> {
  return inlineKeyboard([
    [inlineButton("Risk level", "settings:risk"), inlineButton("Position size", "settings:position")],
    [inlineButton("Drawdown limit", "settings:drawdown")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

composer.command("settings", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  await ctx.reply(buildSettings(userId), { reply_markup: settingsKeyboard() });
});

composer.callbackQuery("settings:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  await ctx.editMessageText(buildSettings(userId), { reply_markup: settingsKeyboard() });
});

composer.callbackQuery("settings:risk", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const strat = getOrCreateStrategy(userId);
  const levels = ["conservative", "moderate", "aggressive"];
  const current = strat.params.riskLevel;
  const next = levels[(levels.indexOf(current) + 1) % levels.length];
  strat.params.riskLevel = next;
  audit("settings_changed", userId, { field: "riskLevel", value: next });
  await ctx.editMessageText(buildSettings(userId), { reply_markup: settingsKeyboard() });
});

composer.callbackQuery("settings:position", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const strat = getOrCreateStrategy(userId);
  const sizes = [1, 2, 3, 5];
  const current = strat.params.maxPositionSizePct;
  const next = sizes[(sizes.indexOf(current) + 1) % sizes.length];
  strat.params.maxPositionSizePct = next;
  audit("settings_changed", userId, { field: "maxPositionSizePct", value: next });
  await ctx.editMessageText(buildSettings(userId), { reply_markup: settingsKeyboard() });
});

composer.callbackQuery("settings:drawdown", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const strat = getOrCreateStrategy(userId);
  const thresholds = [5, 10, 15, 20];
  const current = strat.params.drawdownThresholdPct;
  const next = thresholds[(thresholds.indexOf(current) + 1) % thresholds.length];
  strat.params.drawdownThresholdPct = next;
  audit("settings_changed", userId, { field: "drawdownThresholdPct", value: next });
  await ctx.editMessageText(buildSettings(userId), { reply_markup: settingsKeyboard() });
});

export default composer;
