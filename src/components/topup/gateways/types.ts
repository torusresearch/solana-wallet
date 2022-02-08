export type QuoteAsset = {
  symbol: string;
  price: { [currency: string]: number };
  decimals: number;
};
export type QuoteApiResponse = {
  assets: QuoteAsset[];
  maxFeePercent: number;
};

export type RequestObject = {
  digital_currency: string;
  fiat_currency: string;
  requested_amount?: string;
};
