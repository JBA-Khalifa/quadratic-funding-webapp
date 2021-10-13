const config = {
  cloudName: 'forgelab-io',
  cloudVersion: '1618851062',

  // polkascan
  polkascan: {
    baseUrl: 'http://rpc.testnet.oak.tech:8080/api/v1',
  },

	subscan: {
		apiKey: '',
		baseUrl: 'https://kusama.api.subscan.io/api',
	},

  // OAK token info
  oak: {
    symbol: 'OAK',
    price: 0.35,
    decimals: 10,
  },
};

export default config;
