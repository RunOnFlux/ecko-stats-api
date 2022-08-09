# kaddex-stats-api

### Installation instructions

```
# install mongodb
cp .env.example .env
# set env vars
npm install
npm run build

# reseed volume data
npm run console import:volume kswap.exchange.SWAP/kaddex.exchange.SWAP

# update volume data
npm run console update:volume kswap.exchange.SWAP/kaddex.exchange.SWAP

# seed tvl data
npm run console import:tvl kswap.exchange.UPDATE

# seed candles data
npm run console import:candles

# seed external candles data
npm run console:dev import:external-candles KDA USDT 2021-06-01 2022-06-24

# seed analytics data
npm run console import:analytics-circulating-supply
npm run console import:analytics-burned
npm run console import:analytics-liquidity-mining
npm run console import:analytics-dao-treasury
```
