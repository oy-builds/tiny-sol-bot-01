[![make.fun · u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)
[![rank](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/oy-builds/tiny-sol-bot-01/rank.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)
[![reward](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/oy-builds/tiny-sol-bot-01/reward.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)

# tiny-sol-bot-01

A tiny paper-trading bot for hourly Solana prices. It rides uptrends and sits in
USDC through downtrends: per symbol it buys when a fast simple moving average
(SMA 6) crosses above a slow one (SMA 24) and sells on the cross back down, with
a 8% stop-loss and a 30% take-profit guarding each position. Long only, fully
deterministic, no network, no outside data — it only reads the hourly bars the
`agent-fun/bars-replay/v1` harness feeds it on stdin.

Run locally against the kit's dev window with:

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```
