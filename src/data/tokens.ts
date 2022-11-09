export const PAIR_TOKENS = {
  'coin:runonflux.flux': {
    name: 'coin:runonflux.flux',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'FLUX',
      code: 'runonflux.flux',
    },
  },
  'coin:hypercent.prod-hype-coin': {
    name: 'coin:hypercent.prod-hype-coin',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'HYPE',
      code: 'hypercent.prod-hype-coin',
    },
  },
  'coin:mok.token': {
    name: 'coin:mok.token',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'MOK',
      code: 'mok.token',
    },
  },
  'coin:lago.kwUSDC': {
    name: 'coin:lago.kwUSDC',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'USDC',
      code: 'lago.kwUSDC',
    },
  },
  'coin:kaddex.kdx': {
    name: 'coin:kaddex.kdx',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'KDX',
      code: 'kaddex.kdx',
    },
  },
  'coin:kdlaunch.token': {
    name: 'coin:kdlaunch.token',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'KDL',
      code: 'kdlaunch.token',
    },
  },
  'coin:kdlaunch.kdswap-token': {
    name: 'coin:kdlaunch.kdswap-token',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'KDS',
      code: 'kdlaunch.kdswap-token',
    },
  },
  'coin:free.backalley': {
    name: 'coin:free.backalley',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'BKA',
      code: 'free.backalley',
    },
  },
  'coin:free.kishu-ken': {
    name: 'coin:free.kishu-ken',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'KISHK',
      code: 'free.kishu-ken',
    },
  },
  'coin:free.kapybara-token': {
    name: 'coin:free.kapybara-token',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'KAPY',
      code: 'free.kapybara-token',
    },
  },
  'coin:free.jodie-token': {
    name: 'coin:free.jodie-token',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'JDE',
      code: 'free.jodie-token',
    },
  },
  'coin:lago.kwBTC': {
    name: 'coin:lago.kwBTC',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'kwBTC',
      code: 'lago.kwBTC',
    },
  },
  'coin:lago.USD2': {
    name: 'coin:lago.USD2',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'USD2',
      code: 'lago.USD2',
    },
  },
  'arkade.token:coin': {
    name: 'arkade.token:coin',
    token0: {
      name: 'ARKD',
      code: 'arkade.token',
    },
    token1: {
      name: 'KDA',
      code: 'coin',
    },
  },
  'coin:free.KAYC': {
    name: 'coin:free.KAYC',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'KAYC',
      code: 'free.KAYC',
    },
  },
  'coin:free.corona-token': {
    name: 'coin:free.corona-token',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'CRNA',
      code: 'free.corona-token',
    },
  },
  'coin:free.docu': {
    name: 'coin:free.docu',
    token0: {
      name: 'KDA',
      code: 'coin',
    },
    token1: {
      name: 'DOC',
      code: 'free.docu',
    },
  },
};

export const TOKENS = {
  coin: {
    name: 'KDA',
    code: 'coin',
    extendedName: 'Kadena Coin',
    supplyConfig: null,
  },
  'kaddex.kdx': {
    name: 'KDX',
    code: 'kaddex.kdx',
    extendedName: 'Kaddex',
    supplyConfig: null,
  },
  'runonflux.flux': {
    name: 'FLUX',
    code: 'runonflux.flux',
    extendedName: 'Flux',
    supplyConfig: {
      cron: '0 0 * * *',
      tokenTableName: 'ledger',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'dAmjJNY06Tfo3pCrwtWC_3u2FOEwVY5A2jFqImBhxNs',
        'xfS-eHFuzE72619KflxCn0FKSa5BhvvhyR9THumhdOE',
      ],
    },
  },
  'hypercent.prod-hype-coin': {
    name: 'HYPE',
    code: 'hypercent.prod-hype-coin',
    extendedName: 'Hype',
    supplyConfig: {
      cron: '10 0 * * *',
      tokenTableName: 'ledger',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'rOYS3TM3WkISZVPNyMqbALhsMr0UbGnNHd9rt79pdqM',
        '4dLp53hU4UdrezRAA8yNGr6qgHS8JME2zYEaJUCaFvY',
      ],
    },
  },
  'mok.token': {
    name: 'MOK',
    code: 'mok.token',
    extendedName: 'Mok',
    supplyConfig: {
      cron: '20 0 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'rnQxKFTUnrWfT2Yxu1wva4L0d7Eki64A3VHU1SBCRFk',
        'Jmv7qp5izDnejTSE6fSctjC6Ndm9ZWjQsyuGELPmggg',
      ],
    },
  },
  'lago.kwUSDC': {
    name: 'kwUSDC',
    code: 'lago.kwUSDC',
    extendedName: 'Wrapped USDC',
    supplyConfig: {
      cron: '30 0 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'HUdDlZmVSbPWb0pglDc3BuNzpjBr5lWdQumxZpjtN7A',
        'h2n_CzxJnWQgwOMp8ZEbAuac3eKFH7EzZnkpi1-Z5t4',
      ],
    },
  },
  'kdlaunch.token': {
    name: 'KDL',
    code: 'kdlaunch.token',
    extendedName: 'KDLaunch',
    supplyConfig: {
      cron: '40 0 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'E4IAYM99UixGb4ZdOhsnN97ieIp-VLM-Pw1aMSSNQps',
        '7WcTbL_JivZKrfOiWIpHKeI74alo9F1TbX4fYG9-64g',
      ],
    },
  },
  'kdlaunch.kdswap-token': {
    name: 'KDS',
    code: 'kdlaunch.kdswap-token',
    extendedName: 'KDSwap',
    supplyConfig: {
      cron: '50 0 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'EGW7TehgCmHCGhixRGUDf4hzzIrhfWTDKF4Y4Ya0UIs',
        'wiWV8zE2LnsUFPeVYwsVdjE5ejEAgPccOJGugJsZq-M',
      ],
    },
  },
  'free.backalley': {
    name: 'BKA',
    code: 'free.backalley',
    extendedName: 'Backalley',
    supplyConfig: {
      cron: '0 01 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'jCvFFofM4WLpjz02Q6J_LggOdWIRnafToOi_r6CJA7Y',
        '8MEk8rlXNN-lASnwgXw4u98WYR9VCrBo4TyOmkv2RwE',
      ],
    },
  },
  'free.kishu-ken': {
    name: 'KISHK',
    code: 'free.kishu-ken',
    extendedName: 'Kishu Ken',
    supplyConfig: {
      cron: '10 01 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'Zr-vo5w_gFUHSO1Hbo0TFlQr39pygrghAs_N335uMVA',
        '-PBQ8QWAYBvn_DezL9kM1GiW0RHC-R52Hpwr68dOV2Y',
      ],
    },
  },
  'free.kapybara-token': {
    name: 'KAPY',
    code: 'free.kapybara-token',
    extendedName: 'Kapy',
    supplyConfig: {
      cron: '20 01 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'LKNQ1mSkjWpNGxBhcCxCY45fU2poEHX00eBj0acyZDw',
        'Nk5thBu5UPHfbBClLpQnYso0hJX691L-lqqv6leghn4',
      ],
    },
  },
  'free.jodie-token': {
    name: 'JDE',
    code: 'free.jodie-token',
    extendedName: 'Jodie',
    supplyConfig: {
      cron: '30 01 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        '3GNkXvyb2sSPpMi4UJ3fBV8PAy-eN3jbaub4Q2d-UFg',
        'aC5wNPEY7PmcEZOVnT28Ud_4Y2IuTuPO2-HjSJYr-uc',
      ],
    },
  },
  'lago.kwBTC': {
    name: 'kwBTC',
    code: 'lago.kwBTC',
    extendedName: 'kwBTC',
    supplyConfig: {
      cron: '40 01 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'sPUW8_Od2J9IU8-6KQlwoZRFTD3oPcUbjd0M7jxBZE8',
        'VDtMxO-Sb3yYeOXQAciqkqqdzka-nWsltxOaC4vl0wM',
      ],
    },
  },
  'lago.USD2': {
    name: 'USD2',
    code: 'lago.USD2',
    extendedName: 'USD2',
    supplyConfig: {
      cron: '50 01 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'I92D0oGfpDfgYuJTYq25GJd_phXtk25Wql7mt2k_aXk',
        'RZmFXT3X-We44VGpF2ODxcJ-DU0cviwjeJBd73O-IA4',
      ],
    },
  },
  'arkade.token': {
    name: 'ARKD',
    code: 'arkade.token',
    extendedName: 'ARKD',
    supplyConfig: {
      cron: '0 02 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        '-RswjntIBbuZyV3yobQ8GEVz10R1XWZYigUynOIhjAI',
        'TrL5G5Bo7DwOgmDFj6oNn68moOMyE9NHrt3mGZSv90Y',
      ],
    },
  },
  'free.KAYC': {
    name: 'KAYC',
    code: 'free.KAYC',
    extendedName: 'KAYC',
    supplyConfig: {
      cron: '10 02 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'TnG62MdLCKOXGQrLv6z8RO4jokNyvVZM48vm88z8ee0',
        'kqAa1RLq4i0yx82Sv37yEGu8a6Ha9Z6mQqtY0JTn1IY',
      ],
    },
  },
  'free.corona-token': {
    name: 'CRNA',
    code: 'free.corona-token',
    extendedName: 'CRNA',
    supplyConfig: {
      cron: '20 02 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'pV3ZR-5siArLV7NF5SEDU_RTn3k-2FlFQBfsbkNJ0Ec',
        'ObFo30iTnDHwWDJKAay1SnmTtQotvQiAmTURf1SXGdM',
      ],
    },
  },
  'free.docu': {
    name: 'DOC',
    code: 'free.docu',
    extendedName: 'DOC',
    supplyConfig: {
      cron: '30 02 * * *',
      tokenTableName: 'token-table',
      balanceFieldName: 'balance',
      liquidityHolderAccounts: [
        'B5EURMVnV0aGJfNOPkXUdUypJaIuro1KJT4OG1_5E3E',
        'V9VlkJNO0WxfEomju7kkcC6aB9BSRhLFrqus3h0sl_4',
      ],
    },
  },
};
