import { getDomainKey, getSolRecord, NameRegistryState, Record } from "@bonfida/spl-name-service";
import { getMint } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import nacl from "@toruslabs/tweetnacl-js";
import log from "loglevel";
// From @bonfida/spl-name-service nft.ts

/**
 * Mainnet program ID
 */
export const NAME_TOKENIZER_ID = new PublicKey("nftD3vbNkNqfj2Sd3HZwbpw4BxxKWr4AjGb9X38JeZk");

/**
 * PDA prefix
 */
export const MINT_PREFIX = Buffer.from("tokenized_name");

/**
 * This function can be used to retrieve the owner of a tokenized domain name
 *
 * @param connection - The solana connection object to the RPC node
 * @param nameAccount - The key of the domain name
 * @returns
 */
export const retrieveNftOwner = async (connection: Connection, nameAccount: PublicKey) => {
  try {
    const [mint] = await PublicKey.findProgramAddress([MINT_PREFIX, nameAccount.toBuffer()], NAME_TOKENIZER_ID);

    const mintInfo = await getMint(connection, mint);
    if (mintInfo.supply.toString() === "0") {
      return undefined;
    }

    const { value } = await connection.getTokenLargestAccounts(mint);

    const holder = value.find((e) => e.amount === "1")?.address;
    if (!holder) {
      return undefined;
    }

    const info = await connection.getAccountInfo(holder);
    if (!info || !info.data) {
      return undefined;
    }

    return new PublicKey(info.data.slice(32, 64));
  } catch {
    return undefined;
  }
};

/**
 * This function can be used to verify the validity of a SOL record
 * @param record The record data to verify
 * @param signedRecord The signed data
 * @param pubkey The public key of the signer
 * @returns
 */
export const checkSolRecord = (record: Uint8Array, signedRecord: Uint8Array, pubkey: PublicKey) => {
  return nacl.sign.detached.verify(record, signedRecord, pubkey.toBytes());
};

/*
 *
 * This function can be used to resolve a domain name to transfer funds
 * @param connection The Solana RPC connection object
 * @param domain The domain to resolve
 * @returns
 */
export const bonfidaResolve = async (connection: Connection, domain: string) => {
  const { pubkey } = await getDomainKey(domain);

  const { registry, nftOwner } = await NameRegistryState.retrieve(connection, pubkey);

  if (nftOwner) {
    return nftOwner;
  }

  try {
    const recordKey = await getDomainKey(`${Record.SOL}.${domain}`, true);
    const solRecord = await getSolRecord(connection, domain);

    if (solRecord.data?.length !== 96) {
      throw new Error("Invalid SOL record data");
    }

    const encoder = new TextEncoder();
    const expectedBuffer = Buffer.concat([solRecord.data.slice(0, 32), recordKey.pubkey.toBuffer()]);
    const expected = encoder.encode(expectedBuffer.toString("hex"));

    const valid = checkSolRecord(expected, solRecord.data.slice(32), registry.owner);

    if (!valid) {
      throw new Error("Signature invalid");
    }

    return new PublicKey(solRecord.data.slice(0, 32));
  } catch (err) {
    log.error(err);
  }

  return registry.owner;
};

/**
 * This function can be used to retrieve all the tokenized domains name
 *
 * @param connection - The solana connection object to the RPC node
 * @returns
 */
// export const retrieveNfts = async (connection: Connection) => {
//   const filters = [
//     {
//       memcmp: {
//         offset: 0,
//         bytes: "3",
//       },
//     },
//   ];

//   const result = await connection.getProgramAccounts(NAME_TOKENIZER_ID, {
//     filters,
//   });
//   const offset = 1 + 1 + 32 + 32;
//   return result.map((e) => new PublicKey(e.account.data.slice(offset, offset + 32)));
// };
