import { AccountInfo, Commitment, Connection, PublicKey, Transaction } from "@solana/web3.js";
import base58 from "bs58";
// import log from "loglevel";

export const mockConnection: Partial<Connection> = {
  getRecentBlockhashAndContext: async () => {
    // log.error("blockhash polled");
    return {
      context: { slot: 23134 },
      value: {
        blockhash: "",
        feeCalculator: { lamportsPerSignature: 5000 },
      },
    };
  },
  getMultipleAccountsInfo: async (_publicKeys: PublicKey[], _commitment?: Commitment | undefined): Promise<(AccountInfo<Buffer> | null)[]> => {
    // log.error(publicKeys[0].toBase58());
    return [null];
  },
  sendRawTransaction: async (rawTranaction) => {
    // log.error(rawTranaction)
    const tx = Transaction.from(rawTranaction);
    tx.verifySignatures();
    return base58.encode(tx.signature || []);
  },
  getSignaturesForAddress: async () => {
    return [];
  },
};
export const mockGetConnection = (): Connection => {
  return mockConnection as unknown as Connection;
};
