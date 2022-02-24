import { IKSwapExchangeSWAP } from 'src/interfaces/kswap.exchange.SWAP.interface';

export const statElement: IKSwapExchangeSWAP = {
  blockTime: new Date('2022-02-08T17:43:12.09707Z'), // transaction date
  height: 2397641,
  blockHash: 'APOYBKcuFXs-RGckSXoaHzFREOPQ92U1udUmVl1QWbg',
  requestKey: 'zaGIT7yYpIOflz_3eJEZ6AXGYYLYpG7PKfLOouAtoKc',
  params: [
    '6SMAbH1iWh-6aOtnACqhiGk9BxbGzvYAyDmjwmLBKGc',
    '8d70410942083c0e737be272788b40f20543449b4f80ff52bbec21c8befa4b87',
    4.71660895, // token from quantity
    {
      refSpec: [
        // token from
        {
          namespace: null,
          name: 'fungible-v2',
        },
      ],
      refName: {
        namespace: 'runonflux',
        name: 'flux',
      },
    },
    1.005413215833, // token to quantity
    {
      refSpec: [
        // token to
        {
          namespace: null,
          name: 'fungible-v2',
        },
      ],
      refName: {
        namespace: null,
        name: 'coin',
      },
    },
  ],
  name: 'kswap.exchange.SWAP',
  idx: 3,
  chain: 2,
  moduleHash: 'GQsG3MC7dnwH2F2LNm11gRRveGADLM5YVM5caRLJA0I',
};
