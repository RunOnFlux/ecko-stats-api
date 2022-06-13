# kaddex-stats-api

### Installation instructions

```
# install mongodb
cp .env.example .env
# set env vars
npm install
npm run build

# seed volume data
npm run console import:volume kswap.exchange.SWAP

# seed tvl data
npm run console import:tvl kswap.exchange.UPDATE

# seed candles data
npm run console import:candles
```
