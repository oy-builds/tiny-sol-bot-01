// tiny-sol-bot-01: trend-following SMA crossover, long only.
//
// Per symbol, over hourly closes: buy when the fast SMA(12) crosses above the
// slow SMA(24) with real strength (the fast average clears the slow one by at
// least 0.05%, so flat chop does not trigger entries), sell when it crosses
// back below. Each position also exits on a stop-loss (worth under 95% of its
// cost) or a take-profit (worth over 120% of its cost), so a trend that
// reverses hard does not ride the loss down.
// Sizing: an equal slice of equity per symbol, capped at the 25% weight cap.
// Deterministic: closes only, no clock, no randomness, no network.

import { BPS, runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const FAST = 12;
const SLOW = 24;
const STOP_NUM = 95n; // sell when value * 100 <= cost * 95
const TAKE_NUM = 120n; // sell when value * 100 >= cost * 120
const MAX_SLIPPAGE_BPS = 100;

// Per-symbol close history (raw close units; consistent within a symbol).
const closes = new Map<string, number[]>();

function sma(hist: number[], n: number): number | null {
  if (hist.length < n) return null;
  let sum = 0;
  for (let i = hist.length - n; i < hist.length; i++) sum += hist[i];
  return sum / n;
}

await runBars({
  onBatch(state: BarsState, batch) {
    const crossUp = new Set<string>();
    const crossDown = new Set<string>();
    for (const bar of batch.bars) {
      const hist = closes.get(bar.symbol) ?? [];
      const prevFast = sma(hist, FAST);
      const prevSlow = sma(hist, SLOW);
      hist.push(Number(bar.c));
      closes.set(bar.symbol, hist);
      const fast = sma(hist, FAST);
      const slow = sma(hist, SLOW);
      if (bar.v === '0' || prevFast === null || prevSlow === null || fast === null || slow === null) continue;
      const prevGap = prevFast - prevSlow;
      const gap = fast - slow;
      // Only take a cross that has real strength: the fast average must clear
      // the slow one by at least 0.05%, so flat chop does not trigger entries.
      if (gap > 0 && prevGap <= 0 && gap / slow > 0.0005) crossUp.add(bar.symbol);
      if (gap < 0 && prevGap >= 0) crossDown.add(bar.symbol);
    }
    if (state.warmingUp) return [];

    const { caps, fees } = state.hello;
    const sells: SellInput[] = [];
    const entries: string[] = [];
    for (const { symbol } of state.hello.symbols) {
      const held = state.positions.get(symbol);
      if (held !== undefined) {
        const value = state.value(symbol, held.qty);
        const stop = value * 100n <= held.cost * STOP_NUM;
        const take = value * 100n >= held.cost * TAKE_NUM;
        if (crossDown.has(symbol) || stop || take) {
          sells.push({ side: 'sell', symbol, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
        }
      } else if (crossUp.has(symbol)) {
        entries.push(symbol);
      }
    }

    const orders: (SellInput | BuyInput)[] = sells.slice(0, caps.max_orders_per_bar);
    const slots = Math.min(state.hello.symbols.length, caps.max_open_positions);
    const stake = state.equity / BigInt(slots);
    const byWeight = (BigInt(caps.max_weight_bps) * state.equity) / BPS;
    let room = slots - state.positions.size;
    let cash = state.cash;
    for (const symbol of entries) {
      if (room <= 0 || orders.length >= caps.max_orders_per_bar) break;
      let slice = stake < byWeight ? stake : byWeight;
      if (cash < slice) slice = cash;
      if (slice === 0n || slice < BigInt(fees.min_notional_quote_units)) break;
      orders.push({ side: 'buy', symbol, notional_quote_units: slice, max_slippage_bps: MAX_SLIPPAGE_BPS });
      cash -= slice;
      room--;
    }
    return orders;
  },
});
