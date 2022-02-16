import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Commitment, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";

import { MintLayout, TokenAccountLayout } from "../helpers";

// import { MEMO_PROGRAM_ID, SOL_DECIMALS, TEN } from "./constants";
/** @internal */
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/** @internal */
export const SOL_DECIMALS = 9;

/** @internal */
export const TEN = new BigNumber(10);
/** Information about a token account */
export interface Account {
  /** Address of the account */
  address: PublicKey;
  /** Mint associated with the account */
  mint: PublicKey;
  /** Owner of the account */
  owner: PublicKey;
  /** Number of tokens the account holds */
  amount: bigint;
  /** Authority that can transfer tokens from the account */
  delegate: PublicKey | null;
  /** Number of tokens the delegate is authorized to transfer */
  delegatedAmount: bigint;
  /** True if the account is initialized */
  isInitialized: boolean;
  /** True if the account is frozen */
  isFrozen: boolean;
  /** True if the account is a native token account */
  isNative: boolean;
  /**
   * If the account is a native token account, it must be rent-exempt. The rent-exempt reserve is the amount that must
   * remain in the balance until the account is closed.
   */
  rentExemptReserve: bigint | null;
  /** Optional authority to close the account */
  closeAuthority: PublicKey | null;
}

/** Token account state as stored by the program */
export enum AccountState {
  Uninitialized = 0,
  Initialized = 1,
  Frozen = 2,
}

export async function getAccount(
  connection: Connection,
  address: PublicKey,
  commitment?: Commitment,
  programId = TOKEN_PROGRAM_ID
): Promise<Account> {
  const info = await connection.getAccountInfo(address, commitment);
  if (!info) throw new Error(); // TokenAccountNotFoundError();
  if (!info.owner.equals(programId)) throw new Error(); // TokenInvalidAccountOwnerError();
  //   if (info.data.length != ACCOUNT_SIZE) throw new TokenInvalidAccountSizeError();

  const rawAccount = TokenAccountLayout.decode(info.data);

  return {
    address,
    mint: rawAccount.mint,
    owner: rawAccount.owner,
    amount: rawAccount.amount,
    delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
    delegatedAmount: rawAccount.delegatedAmount,
    isInitialized: rawAccount.state !== AccountState.Uninitialized,
    isFrozen: rawAccount.state === AccountState.Frozen,
    isNative: !!rawAccount.isNativeOption,
    rentExemptReserve: rawAccount.isNativeOption ? rawAccount.isNative : null,
    closeAuthority: rawAccount.closeAuthorityOption ? rawAccount.closeAuthority : null,
  };
}

/** Information about a mint */
export interface Mint {
  /** Address of the mint */
  address: PublicKey;
  /**
   * Optional authority used to mint new tokens. The mint authority may only be provided during mint creation.
   * If no mint authority is present then the mint has a fixed supply and no further tokens may be minted.
   */
  mintAuthority: PublicKey | null;
  /** Total supply of tokens */
  supply: bigint;
  /** Number of base 10 digits to the right of the decimal place */
  decimals: number;
  /** Is this mint initialized */
  isInitialized: boolean;
  /** Optional authority to freeze token accounts */
  freezeAuthority: PublicKey | null;
}

async function getMint(connection: Connection, address: PublicKey, commitment?: Commitment, programId = TOKEN_PROGRAM_ID): Promise<Mint> {
  const info = await connection.getAccountInfo(address, commitment);
  if (!info) throw new Error(); // TokenAccountNotFoundError();
  if (!info.owner.equals(programId)) throw new Error(); // TokenInvalidAccountOwnerError();
  //   if (info.data.length !== MINT_SIZE) throw new TokenInvalidAccountSizeError();

  const rawMint = MintLayout.decode(info?.data);

  return {
    address,
    mintAuthority: rawMint.mintAuthorityOption ? rawMint.mintAuthority : null,
    supply: rawMint.supply,
    decimals: rawMint.decimals,
    isInitialized: rawMint.isInitialized,
    freezeAuthority: rawMint.freezeAuthorityOption ? rawMint.freezeAuthority : null,
  };
}

/**
 * Thrown when a valid transaction can't be created from the inputs provided.
 */
export class CreateTransactionError extends Error {
  name = "CreateTransactionError";
}

/**
 * Optional parameters for creating a Solana Pay transaction.
 */
export interface CreateTransactionParams {
  /** `splToken` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token) */
  splToken?: PublicKey;
  /** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference) */
  reference?: PublicKey | PublicKey[];
  /** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo) */
  memo?: string;
}

/**
 * Create a Solana Pay transaction.
 *
 * **Reference** implementation for wallet providers.
 *
 * @param connection - A connection to the cluster.
 * @param payer - `PublicKey` of the payer.
 * @param recipient - `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient)
 * @param amount - `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount)
 * @param \{CreateTransactionParams\} createTransactionParams - Additional parameters
 * @param createTransactionParams.splToken
 * @param createTransactionParams.reference
 * @param createTransactionParams.memo
 */
export async function createTransaction(
  connection: Connection,
  payer: PublicKey,
  recipient: PublicKey,
  amount: BigNumber,
  { splToken, reference, memo }: CreateTransactionParams = {}
): Promise<Transaction> {
  // Check that the payer and recipient accounts exist
  const payerInfo = await connection.getAccountInfo(payer);
  if (!payerInfo) throw new CreateTransactionError("payer not found");

  const recipientInfo = await connection.getAccountInfo(recipient);
  if (!recipientInfo) throw new CreateTransactionError("recipient not found");

  // A native SOL or SPL token transfer instruction
  let instruction: TransactionInstruction;

  // If no SPL token mint is provided, transfer native SOL
  if (!splToken) {
    // Check that the payer and recipient are valid native accounts
    if (!payerInfo.owner.equals(SystemProgram.programId)) throw new CreateTransactionError("payer owner invalid");
    if (payerInfo.executable) throw new CreateTransactionError("payer executable");
    if (!recipientInfo.owner.equals(SystemProgram.programId)) throw new CreateTransactionError("recipient owner invalid");
    if (recipientInfo.executable) throw new CreateTransactionError("recipient executable");

    // Check that the amount provided doesn't have greater precision than SOL
    if (amount.decimalPlaces() > SOL_DECIMALS) throw new CreateTransactionError("amount decimals invalid");

    // Convert input decimal amount to integer lamports
    const convertedAmount = amount.times(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_FLOOR);

    // Check that the payer has enough lamports
    const lamports = convertedAmount.toNumber();
    if (lamports > payerInfo.lamports) throw new CreateTransactionError("insufficient funds");

    // Create an instruction to transfer native SOL
    instruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports,
    });
  }
  // Otherwise, transfer SPL tokens from payer's ATA to recipient's ATA
  else {
    // Check that the token provided is an initialized mint
    const mint = await getMint(connection, splToken);
    if (!mint.isInitialized) throw new CreateTransactionError("mint not initialized");

    // Check that the amount provided doesn't have greater precision than the mint
    if (amount.decimalPlaces() > mint.decimals) throw new CreateTransactionError("amount decimals invalid");

    // Convert input decimal amount to integer tokens according to the mint decimals
    const convertedAmount = amount.times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);

    // Get the payer's ATA and check that the account exists and can send tokens
    const payerATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splToken, payer);
    const payerAccount = await getAccount(connection, payerATA);
    if (!payerAccount.isInitialized) throw new CreateTransactionError("payer not initialized");
    if (payerAccount.isFrozen) throw new CreateTransactionError("payer frozen");

    // Get the recipient's ATA and check that the account exists and can receive tokens
    const recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splToken, recipient);
    const recipientAccount = await getAccount(connection, recipientATA);
    if (!recipientAccount.isInitialized) throw new CreateTransactionError("recipient not initialized");
    if (recipientAccount.isFrozen) throw new CreateTransactionError("recipient frozen");

    // Check that the payer has enough tokens
    const tokens = BigInt(String(convertedAmount));
    if (tokens > payerAccount.amount) throw new CreateTransactionError("insufficient funds");

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
    instruction = Token.createTransferCheckedInstruction(
      TOKEN_PROGRAM_ID,
      payerATA,
      splToken,
      recipientATA,
      payer,
      [],
      Number(tokens),
      mint.decimals
    );
  }

  // If reference accounts are provided, add them to the transfer instruction
  if (reference) {
    // if (!Array.isArray(reference)) {
    //   reference = [reference];
    // }
    const referenceArray = Array.isArray(reference) ? reference : [reference];
    // eslint-disable-next-line no-restricted-syntax
    for (const pubkey of referenceArray) {
      instruction.keys.push({ pubkey, isWritable: false, isSigner: false });
    }
  }

  // Create the transaction
  const transaction = new Transaction();

  // If a memo is provided, add it to the transaction before adding the transfer instruction
  if (memo != null) {
    transaction.add(
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memo, "utf8"),
      })
    );
  }

  // Add the transfer instruction to the transaction
  transaction.add(instruction);

  return transaction;
}
