export class TickerDto {
  baseId: string;
  baseName: string;
  baseSymbol: string;
  quoteId: string;
  quoteName: string;
  quoteSymbol: string;
  lastPrice: number;
  baseVolume: number;
  quoteVolume: number;
  liquidityInUsd: number;
}
