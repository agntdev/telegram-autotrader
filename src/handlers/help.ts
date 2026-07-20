import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "ℹ️ AutoTrader connects to your brokerage account and executes\n" +
  "conservative, automated trading strategies on your behalf.\n\n" +
  "How it works:\n" +
  "1. Connect your brokerage account\n" +
  "2. Review the default strategy settings\n" +
  "3. Activate trading — the bot handles the rest\n\n" +
  "You'll get real-time notifications for every trade and can\n" +
  "pause or adjust settings at any time.\n\n" +
  "Tap /start to open the menu.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
