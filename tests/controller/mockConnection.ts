import { AccountInfo, Commitment, Connection, PublicKey, Transaction } from "@solana/web3.js";
import base58 from "bs58";

import { sKeyPair } from "./mockData";
// import log from "loglevel";

let slotCounter = 23134;

export const accountInfo: Record<string, AccountInfo<Buffer>> = {
  oczAiRTdUFsmEKq5LBwLp1fAqF43B6AAHouKR7JxutG: {
    data: Buffer.from("", "base64"),
    executable: false,
    lamports: 5616720,
    owner: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
    rentEpoch: 275,
  },
  x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL: {
    data: Buffer.from("", "base64"),
    executable: false,
    lamports: 595644320,
    owner: new PublicKey("11111111111111111111111111111111"),
    rentEpoch: 275,
  },
  [sKeyPair[0].publicKey.toBase58()]: {
    data: Buffer.from("", "base64"),
    executable: false,
    lamports: 595644320,
    owner: new PublicKey("11111111111111111111111111111111"),
    rentEpoch: 275,
  },
};

const tokenOwnedInfo: { pubkey: PublicKey; account: AccountInfo<any> }[] = [
  {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: "2sTumM2oVLdurFrXWKVLpipdfwwY3D9ZspLh4Yo5zK6o",
            owner: "x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL",
            state: "initialized",
            tokenAmount: {
              amount: "0",
              decimals: 0,
              uiAmount: 0,
              uiAmountString: "0",
            },
          },
          type: "account",
        },
        program: "spl-token",
        space: 165,
      },
      executable: false,
      lamports: 2039280,
      owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      rentEpoch: 274,
    },
    pubkey: new PublicKey("ESGe1wyNH1R9wxTUYinPkymfdUmZcVdt94njoEmXhwtC"),
  },
  {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: "CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp",
            owner: "x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL",
            state: "initialized",
            tokenAmount: {
              amount: "699000",
              decimals: 6,
              uiAmount: 0.699,
              uiAmountString: "0.699",
            },
          },
          type: "account",
        },
        program: "spl-token",
        space: 165,
      },
      executable: false,
      lamports: 202039280,
      owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      rentEpoch: 275,
    },
    pubkey: new PublicKey("2V1TFBBsxRJbrCPvVswNP8n5Th9nB8KQcfG58NtS6m7Y"),
  },
  {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: "9eTtrV7eXo4g4xKtx1kcVrK6a5baSGgt9vBa8CaXNdCP",
            owner: "x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL",
            state: "initialized",
            tokenAmount: {
              amount: "1",
              decimals: 0,
              uiAmount: 1,
              uiAmountString: "1",
            },
          },
          type: "account",
        },
        program: "spl-token",
        space: 165,
      },
      executable: false,
      lamports: 2039280,
      owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      rentEpoch: 274,
    },
    pubkey: new PublicKey("EE2SyXCvxpP8nNnoXBYQwPeuzL7oVqdE69Fo9Y5dUG2g"),
  },
];

const generateSignatureStatus = (signature: string, status = "finalized", signSlot = 0) => {
  const slot = signSlot || slotCounter;
  return {
    blockTime: 1642059750 + slot,
    confirmationStatus: status,
    err: null,
    memo: null,
    signature,
    slot,
  };
};

export const mockConnection: Partial<Connection> = {
  getRecentBlockhashAndContext: async () => {
    // log.error(Date.now());
    // log.error("blockhash polled");
    slotCounter += 1;
    return {
      context: { slot: slotCounter },
      value: {
        blockhash: slotCounter.toString(),
        feeCalculator: { lamportsPerSignature: 5000 },
      },
    };
  },
  getMultipleAccountsInfo: async (publicKeys: PublicKey[], _commitment?: Commitment | undefined): Promise<(AccountInfo<Buffer> | null)[]> => {
    return publicKeys.map((item) => accountInfo[item.toBase58()]);
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

  getSignatureStatus: async (_signatures) => {
    return {
      context: { slot: slotCounter },
      value: null,
    };
  },

  getConfirmedSignaturesForAddress2: async (_address) => {
    // const tx = transaction.map( (item)=> item. === )
    const signatures = ["asdfasdf", "asdfasdf"];
    return signatures.map((signature) => {
      return generateSignatureStatus(signature);
    });
  },

  getTokenAccountsByOwner: async (ownerAddress, _filter) => {
    const tokenOwned = tokenOwnedInfo.filter((item) => {
      return item.account.data.owner.toBase58() === ownerAddress;
    });

    return {
      context: { slot: slotCounter },
      value: tokenOwned,
    };
  },
};

export const mockGetConnection = (): Connection => {
  return mockConnection as unknown as Connection;
};
