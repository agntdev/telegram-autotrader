import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  mainMenuKeyboard,
  inlineButton,
  inlineKeyboard,
  registerMainMenuItem,
} from "../toolkit/index.js";
import {
  getUser,
  getOrCreateUser,
  getActiveAccount,
  getOrCreateStrategy,
  now,
} from "../store.js";

// Register features as main-menu buttons (button-first UX).
registerMainMenuItem({ label: "🔗 Connect", data: "link:show", order: 10 });
registerMainMenuItem({ label: "📊 Status", data: "status:show", order: 20 });
registerMainMenuItem({ label: "📈 Performance", data: "performance:show", order: 30 });
registerMainMenuItem({ label: "⏸ Pause", data: "pause:show", order: 40 });
registerMainMenuItem({ label: "▶️ Resume", data: "resume:show", order: 50 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:show", order: 60 });
registerMainMenuItem({ label: "🔌 Disconnect", data: "unlink:show", order: 70 });

function buildWelcome(userId: number, displayName: string): string {
  getOrCreateUser(userId, displayName);
  const acct = getActiveAccount(userId);
  const strat = getOrCreateStrategy(userId);

  const acctLine = acct
    ? `Brokerage: connected (${acct.exchange})`
    : "Brokerage: not connected";
  const tradeLine = strat.active ? "Trading: active" : "Trading: inactive";

  return (
    `👋 Welcome to AutoTrader.\n\n` +
    `${acctLine}\n` +
    `${tradeLine}\n\n` +
    `Tap a button below to get started.`
  );
}

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  const userId = ctx.from?.id ?? 0;
  const name = ctx.from?.first_name ?? "there";
  await ctx.reply(buildWelcome(userId, name), {
    reply_markup: mainMenuKeyboard(),
  });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id ?? 0;
  const name = ctx.from?.first_name ?? "there";
  await ctx.editMessageText(buildWelcome(userId, name), {
    reply_markup: mainMenuKeyboard(),
  });
});

export default composer;
