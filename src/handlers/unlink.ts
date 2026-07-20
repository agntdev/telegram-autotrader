import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, confirmKeyboard } from "../toolkit/index.js";
import {
  getActiveAccount,
  removeLinkedAccounts,
  setStrategyActive,
  audit,
} from "../store.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

const UNLINK_TEXT =
  "🔌 Disconnect account?\n\n" +
  "Trading will be paused and your account will be removed.\n" +
  "You can reconnect at any time.";

const DONE_TEXT =
  "Account disconnected. Trading has been paused.\n\n" +
  "Tap Connect to link a new account.";

const NO_ACCOUNT_TEXT =
  "No linked account to disconnect.";

composer.command("unlink", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  const acct = getActiveAccount(userId);
  if (!acct) {
    await ctx.reply(NO_ACCOUNT_TEXT, { reply_markup: backToMenu });
    return;
  }
  ctx.session.step = "unlink:confirm";
  await ctx.reply(UNLINK_TEXT, {
    reply_markup: confirmKeyboard("unlink"),
  });
});

composer.callbackQuery("unlink:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const acct = getActiveAccount(userId);
  if (!acct) {
    await ctx.editMessageText(NO_ACCOUNT_TEXT, { reply_markup: backToMenu });
    return;
  }
  ctx.session.step = "unlink:confirm";
  await ctx.editMessageText(UNLINK_TEXT, {
    reply_markup: confirmKeyboard("unlink"),
  });
});

composer.callbackQuery("unlink:yes", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "unlink:confirm") return;
  ctx.session.step = undefined;

  const userId = ctx.from?.id ?? 0;
  setStrategyActive(userId, false);
  removeLinkedAccounts(userId);
  ctx.session.linkedAccountId = undefined;
  ctx.session.strategyActive = false;

  audit("account_unlinked", userId);

  await ctx.editMessageText(DONE_TEXT, { reply_markup: backToMenu });
});

composer.callbackQuery("unlink:no", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "unlink:confirm") return;
  ctx.session.step = undefined;
  await ctx.editMessageText("Disconnect cancelled.", { reply_markup: backToMenu });
});

export default composer;
