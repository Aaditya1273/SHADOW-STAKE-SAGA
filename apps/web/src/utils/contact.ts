import { defineChain } from 'viem'

export const OneChainTestnet = defineChain({
    id: 1, // OneChain testnet
    name: "OneChain Testnet",
    network: "OneChain Testnet",
    nativeCurrency: {
      decimals: 9,
      name: "OneChain Token",
      symbol: "OCT",
    },
    rpcUrls: {
      default: {
        http: ["https://rpc-testnet.onelabs.cc:443"],
      },
      public: {
        http: ["https://rpc-testnet.onelabs.cc:443"],
      },
    },
    blockExplorers: {
      default: { name: "OneChain Explorer", url: "https://testnet.suivision.xyz/" },
    },
    testnet: true,
  });