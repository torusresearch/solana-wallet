import { AccountInfo, Commitment, Connection, PublicKey, Transaction } from "@solana/web3.js";
import base58 from "bs58";
import log from "loglevel";

let slotCounter = 23134;

export const mockConnection: Partial<Connection> = {
  getRecentBlockhashAndContext: async () => {
    log.error("blockhash polled");
    slotCounter += 1;
    return {
      context: { slot: slotCounter },
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
  getSignatureStatus: async () => {
    return {
      context: { slot: slotCounter },
      value: null,
    };
  },
};
export const mockGetConnection = (): Connection => {
  return mockConnection as unknown as Connection;
};
