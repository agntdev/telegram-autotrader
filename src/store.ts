// Persistent data store for the AutoTrader bot.
// Uses module-level Maps as the durable data layer. In production, swap for
// Redis-backed storage. The harness tests use this in-memory store directly.

// ---------------------------------------------------------------------------
// Clock — injectable seam for time-based behavior (AGENTS.md requirement).
// Override in tests to drive schedules, cutoffs, and "today" decisions.
// ---------------------------------------------------------------------------

let clockFn: () => number = () => Date.now();
export function now(): number { return clockFn(); }
export function setClock(fn: () => number): void { clockFn = fn; }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  telegramId: number;
  displayName: string;
  language?: string;
}

export interface LinkedAccount {
  id: string;
  userId: number;
  exchange: string;
  maskedAccountId: string;
  status: "active" | "inactive" | "error";
  permissions: string[];
  linkedAt: number;
}

export interface TradingStrategy {
  id: string;
  userId: number;
  active: boolean;
  params: {
    maxPositionSizePct: number;
    drawdownThresholdPct: number;
    allowedSymbols: string[];
    riskLevel: string;
  };
  metrics: {
    totalReturnPct: number;
    winRate: number;
    totalTrades: number;
    sharpeRatio: number;
  };
  startedAt?: number;
  pausedAt?: number;
}

export interface Order {
  id: string;
  userId: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  status: "filled" | "pending" | "cancelled";
  brokerExecutionId?: string;
}

export interface AuditEntry {
  timestamp: number;
  action: string;
  userId: number;
  params: Record<string, unknown>;
  result: "success" | "failure";
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const users = new Map<number, UserProfile>();
const accounts = new Map<string, LinkedAccount>();
const strategies = new Map<string, TradingStrategy>();
const orders = new Map<string, Order>();
const auditLog: AuditEntry[] = [];

// Index: userId → account ids
const userAccountIndex = new Map<number, string[]>();
// Index: userId → strategy id
const userStrategyIndex = new Map<number, string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;
function genId(prefix: string): string {
  return `${prefix}_${++idCounter}_${now()}`;
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export function getOrCreateUser(telegramId: number, displayName: string): UserProfile {
  let u = users.get(telegramId);
  if (!u) {
    u = { telegramId, displayName };
    users.set(telegramId, u);
  }
  return u;
}

export function getUser(telegramId: number): UserProfile | undefined {
  return users.get(telegramId);
}

// ---------------------------------------------------------------------------
// Linked accounts
// ---------------------------------------------------------------------------

export function getLinkedAccounts(userId: number): LinkedAccount[] {
  const ids = userAccountIndex.get(userId) ?? [];
  return ids.map((id) => accounts.get(id)).filter((a): a is LinkedAccount => a != null);
}

export function getActiveAccount(userId: number): LinkedAccount | undefined {
  return getLinkedAccounts(userId).find((a) => a.status === "active");
}

export function createLinkedAccount(
  userId: number,
  exchange: string,
): LinkedAccount {
  const id = genId("acct");
  const acct: LinkedAccount = {
    id,
    userId,
    exchange,
    maskedAccountId: `****${String(userId).slice(-4)}`,
    status: "active",
    permissions: ["balance_view", "trade_execution"],
    linkedAt: now(),
  };
  accounts.set(id, acct);
  const idx = userAccountIndex.get(userId) ?? [];
  idx.push(id);
  userAccountIndex.set(userId, idx);
  return acct;
}

export function removeLinkedAccounts(userId: number): void {
  const ids = userAccountIndex.get(userId) ?? [];
  for (const id of ids) accounts.delete(id);
  userAccountIndex.set(userId, []);
}

// ---------------------------------------------------------------------------
// Trading strategies
// ---------------------------------------------------------------------------

export function getOrCreateStrategy(userId: number): TradingStrategy {
  const existingId = userStrategyIndex.get(userId);
  if (existingId) {
    const s = strategies.get(existingId);
    if (s) return s;
  }
  const id = genId("strat");
  const strat: TradingStrategy = {
    id,
    userId,
    active: false,
    params: {
      maxPositionSizePct: 2,
      drawdownThresholdPct: 10,
      allowedSymbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
      riskLevel: "conservative",
    },
    metrics: {
      totalReturnPct: 0,
      winRate: 0,
      totalTrades: 0,
      sharpeRatio: 0,
    },
  };
  strategies.set(id, strat);
  userStrategyIndex.set(userId, id);
  return strat;
}

export function setStrategyActive(userId: number, active: boolean): void {
  const strat = getOrCreateStrategy(userId);
  strat.active = active;
  if (active) {
    strat.startedAt = now();
    strat.pausedAt = undefined;
  } else {
    strat.pausedAt = now();
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export function createOrder(
  userId: string,
  symbol: string,
  side: "buy" | "sell",
  size: number,
  price: number,
  status: "filled" | "pending" | "cancelled" = "filled",
): Order {
  const id = genId("ord");
  const order: Order = {
    id,
    userId,
    timestamp: now(),
    symbol,
    side,
    size,
    price,
    status,
    brokerExecutionId: `BRK-${id}`,
  };
  orders.set(id, order);
  return order;
}

export function getOrder(orderId: string): Order | undefined {
  return orders.get(orderId);
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export function audit(
  action: string,
  userId: number,
  params: Record<string, unknown> = {},
  result: "success" | "failure" = "success",
): void {
  auditLog.push({ timestamp: now(), action, userId, params, result });
}

export function getAuditLog(userId: number): AuditEntry[] {
  return auditLog.filter((e) => e.userId === userId);
}

// ---------------------------------------------------------------------------
// Reset — test-only hook. Clears all stored data so specs start fresh.
// ---------------------------------------------------------------------------

export function _resetStore(): void {
  users.clear();
  accounts.clear();
  strategies.clear();
  orders.clear();
  auditLog.length = 0;
  userAccountIndex.clear();
  userStrategyIndex.clear();
  idCounter = 0;
}
