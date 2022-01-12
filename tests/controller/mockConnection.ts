import { Connection } from "@solana/web3.js";

export const mockConnection = (): Connection => {
  const mockc = {
    getRecentBlockhashAndContext: async () => {
      return {
        context: { slot: 23134 },
        value: {
          blockhash: "",
          feeCalculator: { lamportsPerSignature: 5000 },
        },
      };
    },
  } as Partial<Connection>;
  return mockc as unknown as Connection;
};
