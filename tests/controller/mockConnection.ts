import { AccountInfo, Commitment, Connection, PublicKey } from "@solana/web3.js";
import log from "loglevel";

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
    getMultipleAccountsInfo: async (publicKeys: PublicKey[], _commitment?: Commitment | undefined): Promise<(AccountInfo<Buffer> | null)[]> => {
      log.error(publicKeys[0].toBase58());
      return [null];
    },
  } as Partial<Connection>;
  return mockc as unknown as Connection;
};
