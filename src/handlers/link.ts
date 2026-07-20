import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, confirmKeyboard } from "../toolkit/index.js";
import {
  getActiveAccount,
  createLinkedAccount,
  audit,
  now,
} from "../store.js";

const composer = new Composer<Ctx>();

const LINK_TEXT =
  "🔗 Connect your brokerage account\n\n" +
  "We'll link your account for balance viewing and trade execution.\n" +
  "Your credentials are encrypted and never stored in plain text.";

const CONNECTING_TEXT =
  "⏳ Connecting to your brokerage…\n\n" +
  "Verifying credentials and setting up secure access.";

const DONE_TEXT =
  "✅ Account connected.\n\n" +
  "Your brokerage account is now linked. You can review settings\n" +
  "or activate trading from the main menu.";

const ALREADY_LINKED_TEXT =
  "Your brokerage account is already connected.\n\n" +
  "Tap Disconnect to remove it first, then try again.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

// Entry point — /link command
composer.command("link", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  const existing = getActiveAccount(userId);
  if (existing) {
    await ctx.reply(ALREADY_LINKED_TEXT, { reply_markup: backToMenu });
    return;
  }
  ctx.session.step = "link:confirm";
  await ctx.reply(LINK_TEXT, {
    reply_markup: confirmKeyboard("link"),
  });
});

// Entry point — menu button
composer.callbackQuery("link:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const existing = getActiveAccount(userId);
  if (existing) {
    await ctx.editMessageText(ALREADY_LINKED_TEXT, { reply_markup: backToMenu });
    return;
  }
  ctx.session.step = "link:confirm";
  await ctx.editMessageText(LINK_TEXT, {
    reply_markup: confirmKeyboard("link"),
  });
});

// Confirm — yes
composer.callbackQuery("link:yes", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "link:confirm") return;
  ctx.session.step = undefined;

  const userId = ctx.from?.id ?? 0;

  // Show connecting state
  await ctx.editMessageText(CONNECTING_TEXT);

  // Simulate connection (real impl would call brokerage OAuth API)
  const acct = createLinkedAccount(userId, "simulated_exchange");
  ctx.session.linkedAccountId = acct.id;

  audit("account_linked", userId, { exchange: acct.exchange });

  await ctx.editMessageText(DONE_TEXT, { reply_markup: backToMenu });
});

// Confirm — no
composer.callbackQuery("link:no", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "link:confirm") return;
  ctx.session.step = undefined;
  await ctx.editMessageText("Linking cancelled. Tap /start to go back.", {
    reply_markup: backToMenu,
  });
});

export default composer;
