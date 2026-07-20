# Telegram AutoTrader — Bot specification

**Archetype:** finance

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A free Telegram bot that connects to users' brokerage/exchange accounts to execute automated, configurable conservative trading strategies. It provides real-time trade notifications, risk controls, and account management without custodying funds.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Retail traders
- Non-technical users
- Risk-aware investors

## Success criteria

- Users can securely link and manage brokerage accounts
- Automated trading executes with configurable risk parameters
- Real-time notifications for trades and system alerts
- Automatic pause on drawdown thresholds

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with onboarding and status
- **/link** (command, actor: user, command: /link) — Initiate brokerage account linking flow
- **/status** (command, actor: user, command: /status) — Show current open positions and strategy status
- **/performance** (command, actor: user, command: /performance) — Display historical performance metrics
- **/pause** (command, actor: user, command: /pause) — Immediately stop trading
- **/resume** (command, actor: user, command: /resume) — Restart trading after pause
- **/settings** (command, actor: user, command: /settings) — Adjust risk parameters and drawdown thresholds
- **/unlink** (command, actor: user, command: /unlink) — Disconnect brokerage account
- **/help** (command, actor: user, command: /help) — Show command list and help

## Flows

### Onboarding
_Trigger:_ /start

1. Display welcome message with risk disclaimer
2. Request brokerage account linking
3. Request permissions for balance/view and trade execution
4. Verify connection and show account summary

_Data touched:_ User profile, Linked account

### Activation
_Trigger:_ /start

1. Present default strategy parameters
2. Request explicit activation confirmation
3. Begin live trading with default settings

_Data touched:_ Trading strategy instance

### Trade Execution
_Trigger:_ Market data update

1. Evaluate market conditions against strategy
2. Place order via user's brokerage API
3. Send trade confirmation to user's Telegram

_Data touched:_ Orders and executions, Audit log

### Drawdown Monitoring
_Trigger:_ Performance check

1. Calculate 7-day drawdown percentage
2. Pause trading if threshold exceeded
3. Send alert to user and admin

_Data touched:_ Trading strategy instance, Audit log

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Telegram user identity and preferences
  - fields: Telegram ID, display name, language preference
- **Linked account** _(retention: persistent)_ — Brokerage/exchange connection metadata
  - fields: exchange identifier, masked account id, connection status, permissions granted
- **Trading strategy instance** _(retention: persistent)_ — Active strategy parameters and status
  - fields: strategy id, active/inactive, parameter set, performance metrics
- **Orders and executions** _(retention: persistent)_ — Trade history and status
  - fields: order id, timestamp, symbol, size, price, status, broker execution id
- **Notifications/alerts** _(retention: session)_ — System and trade alerts
  - fields: type, message, timestamp, read/unread
- **Audit log** _(retention: persistent)_ — Compliance and troubleshooting records
  - fields: action timestamp, action type, parameters, result status

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure admin notification settings
- Review audit logs for compliance
- Adjust default strategy parameters

## Notifications

- Trade execution alerts to user's Telegram chat
- Critical system alerts to admin Telegram chat

## Permissions & privacy

- Access to view user's account balance and place trades via linked brokerage APIs
- Encrypted storage of user account tokens
- User consent required for linking accounts and activating trading

## Edge cases

- Failed brokerage API connection during trade execution
- User input errors during account linking
- Automatic pause on drawdown exceeding 10% in 7-day window

## Required tests

- End-to-end onboarding flow with account linking and activation confirmation
- Trade execution and notification delivery under simulated market conditions
- Auto-pause functionality when drawdown threshold is triggered

## Assumptions

- Default risk parameters are set to conservative values for retail users
- No platform fees are charged to users
- Brokerage APIs support OAuth-style connections for secure linking
