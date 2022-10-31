import { Creator, Metadata, MetadataData, MetadataDataData } from "@metaplex-foundation/mpl-token-metadata";
import { Mint, MintLayout, RawMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountInfo, Commitment, Connection, Message, ParsedAccountData, PublicKey, VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";
import crypto from "crypto";
import log from "loglevel";

import { OffChainMetaplexUri, sKeyPair } from "./mockData";

let slotCounter = 23134;

export const mockMintAddress = ["CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp", "2sTumM2oVLdurFrXWKVLpipdfwwY3D9ZspLh4Yo5zK6o"];
export const mockMintInfo: Record<string, Mint> = {
  [mockMintAddress[0]]: {
    address: new PublicKey(mockMintAddress[0]),
    mintAuthority: sKeyPair[0].publicKey,
    freezeAuthority: sKeyPair[0].publicKey,
    decimals: 6,
    supply: BigInt(1000000000),
    isInitialized: true,
  },
  [mockMintAddress[1]]: {
    address: new PublicKey(mockMintAddress[1]),
    mintAuthority: sKeyPair[0].publicKey,
    freezeAuthority: sKeyPair[0].publicKey,
    decimals: 0,
    supply: BigInt(1000000000),
    isInitialized: true,
  },
};

export const mockSimulateTransaction = {
  err: null,
  logs: null,
  accounts: [
    {
      data: ["", "base64"],
      executable: false,
      lamports: 595644320,
      owner: "11111111111111111111111111111111",
      rentEpoch: 342,
    },
  ],
};

const generateAccountInfo = async () => {
  // mint buf len 82
  const genMintLayout = (mintInfo: Mint) => {
    const buf = Buffer.alloc(82);
    const mintocz: RawMint = {
      mintAuthorityOption: mintInfo.mintAuthority ? 1 : 0,
      mintAuthority: mintInfo.mintAuthority || new PublicKey(0),
      supply: mintInfo.supply,
      decimals: mintInfo.decimals,
      isInitialized: mintInfo.isInitialized,
      freezeAuthorityOption: mintInfo.freezeAuthority ? 1 : 0,
      freezeAuthority: mintInfo.freezeAuthority || new PublicKey(0),
    };
    const offset = MintLayout.encode(mintocz, buf);
    log.info(offset); // 82
    return buf;
  };

  const buf = genMintLayout(mockMintInfo[mockMintAddress[0]]);
  // const buf = genMintLayout({
  //   mintAuthority: sKeyPair[0].publicKey,
  //   freezeAuthority: sKeyPair[0].publicKey,
  //   decimals: 0,
  //   supply: new BN(1000000000),
  //   isInitialized: true,
  // });

  // const decodeMintInfo: any = MintLayout.decode(buf);

  // log.info(decodeMintInfo.supply.toNumber());
  // log.info(decodeMintInfo.isInitialized);

  // Metaplex data Layout
  const mdpda = await Metadata.getPDA(new PublicKey(mockMintAddress[1]));

  const creator = new Creator({ address: sKeyPair[0].publicKey.toBase58(), verified: true, share: 1 });
  const mdd = new MetadataDataData({ name: "nft", symbol: "BSH", uri: OffChainMetaplexUri, sellerFeeBasisPoints: 0, creators: [creator] });
  const md = new MetadataData({
    updateAuthority: creator.address,
    data: mdd,
    mint: mockMintAddress[1],
    primarySaleHappened: false,
    isMutable: false,
    editionNonce: 0,
  });

  const mds = MetadataData.serialize(md);
  // log.error(mds);
  // const dsmd = MetadataData.deserialize(mds);
  // log.error(dsmd);

  // export const accountInfo: Record<string, AccountInfo<Buffer>> = {
  const account = {
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
    [sKeyPair[1].publicKey.toBase58()]: {
      data: Buffer.from("", "base64"),
      executable: false,
      lamports: 595644320,
      owner: new PublicKey("11111111111111111111111111111111"),
      rentEpoch: 275,
    },
    [sKeyPair[2].publicKey.toBase58()]: {
      data: Buffer.from("", "base64"),
      executable: false,
      lamports: 595644320,
      owner: new PublicKey("11111111111111111111111111111111"),
      rentEpoch: 275,
    },
    [sKeyPair[3].publicKey.toBase58()]: {
      data: Buffer.from("", "base64"),
      executable: false,
      lamports: 595644320,
      owner: new PublicKey("11111111111111111111111111111111"),
      rentEpoch: 275,
    },
    // Mint AccountInfo
    [mockMintAddress[0]]: {
      data: buf,
      executable: false,
      lamports: 5616720,
      owner: TOKEN_PROGRAM_ID,
      rentEpoch: 275,
    },
    [mockMintAddress[1]]: {
      data: buf,
      executable: false,
      lamports: 5616720,
      owner: TOKEN_PROGRAM_ID,
      rentEpoch: 275,
    },
    // Metaplex AccountInfo
    [mdpda.toBase58()]: {
      data: mds,
      executable: false,
      lamports: 5616790,
      owner: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      rentEpoch: 275,
    },
    // TokenAccountInfo
  };
  return account;
};
export const accountInfoPromise = generateAccountInfo();

const parsedTokenAccountInfo: { pubkey: PublicKey; account: AccountInfo<ParsedAccountData> }[] = [
  {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: "2sTumM2oVLdurFrXWKVLpipdfwwY3D9ZspLh4Yo5zK6o",
            // owner: "x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL",
            owner: sKeyPair[0].publicKey.toBase58(),
            state: "initialized",
            tokenAmount: {
              amount: "0",
              decimals: 1,
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
            mint: "E4nC2ThDznHgwdFEPyze8p9U28ueRuomx8o3MTgNM7yz",
            // owner: "x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL",
            owner: sKeyPair[0].publicKey.toBase58(),
            state: "initialized",
            tokenAmount: {
              amount: "0",
              decimals: 1,
              uiAmount: 0,
              uiAmountString: "0",
            },
            decimals: 1,
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
    pubkey: new PublicKey("E4nC2ThDznHgwdFEPyze8p9U28ueRuomx8o3MTgNM7yz"),
  },
  {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: "CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp",
            owner: "x1QTdVMcfnTJPEWjKLDRn52527Qi2itcLXU2qpgaUVL",
            // owner: sKeyPair[0].publicKey.toBase58(),
            state: "initialized",
            tokenAmount: {
              amount: "699000",
              decimals: 6,
              uiAmount: 0.699,
              uiAmountString: "0.699",
            },
            decimals: 6,
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
  getRecentBlockhash: async () => {
    return {
      blockhash: base58.encode(crypto.createHash("sha256").update(slotCounter.toString()).digest()),
      feeCalculator: { lamportsPerSignature: 5000 },
    };
  },
  rpcEndpoint: "http://localhost:8080/",
  getLatestBlockhash: async () => {
    return {
      blockhash: base58.encode(crypto.createHash("sha256").update(slotCounter.toString()).digest()),
      lastValidBlockHeight: Math.floor(Math.random() * 1000000000),
    };
  },
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
    const account = await accountInfoPromise;
    const returnResult = publicKeys.map((item) => {
      // log.error(item.toBase58());
      return account[item.toBase58()];
    });
    // log.error(returnResult);
    return returnResult;
  },

  getAccountInfo: async (publickey) => {
    const accountInfo = await accountInfoPromise;
    return accountInfo[publickey.toBase58()] || null;
  },
  sendRawTransaction: async (rawTranaction) => {
    // log.error(rawTranaction)
    const tx = VersionedTransaction.deserialize(rawTranaction as Uint8Array);
    return tx.signatures.toString();
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

  getParsedTokenAccountsByOwner: async (ownerAddress, _filter) => {
    const tokenOwned = parsedTokenAccountInfo.filter((item) => {
      return item.account.data.parsed.info.owner === ownerAddress.toBase58();
    });

    return {
      context: { slot: slotCounter },
      value: tokenOwned,
    };
  },

  getFeeForMessage: async (_message: Message) => {
    return {
      context: { slot: slotCounter },
      value: 1,
    };
  },

  getParsedAccountInfo: async (accountAddress: PublicKey) => {
    const tokenOwned = parsedTokenAccountInfo.find((item) => {
      return item.pubkey === accountAddress;
    });
    return {
      context: { slot: slotCounter },
      value: tokenOwned?.account || parsedTokenAccountInfo[1].account,
    };
  },
};

export const mockGetConnection = (): Connection => {
  return mockConnection as unknown as Connection;
};
