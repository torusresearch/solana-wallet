import {
  Account,
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  MintLayout,
  RawMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  Message,
  PublicKey,
  SimulatedTransactionResponse,
  SystemInstruction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import BigNumber from "bignumber.js";
import log from "loglevel";

import { DISCORD, GITHUB, GOOGLE, REDDIT, SOL, TWITTER } from "./enums";
import { DecodedDataType, decodeInstruction } from "./instruction_decoder";
import { AccountEstimation, ClubbedNfts, FinalTxData, SolAndSplToken } from "./interfaces";

export function ruleVerifierId(selectedTypeOfLogin: string, value: string): boolean {
  if (selectedTypeOfLogin === SOL) {
    try {
      new PublicKey(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (selectedTypeOfLogin === GOOGLE) {
    return /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(value);
  }
  if (selectedTypeOfLogin === REDDIT) {
    return /^[\w-]+$/.test(value) && !/\s/.test(value) && value.length >= 3 && value.length <= 20;
  }
  if (selectedTypeOfLogin === DISCORD) {
    return /^\d*$/.test(value) && value.length === 18;
  }

  if (selectedTypeOfLogin === TWITTER) {
    return /^@?(\w){1,15}$/.test(value);
  }

  if (selectedTypeOfLogin === GITHUB) {
    return /^(?!.*(-{2}))(?!^-.*$)(?!^.*-$)[\w-]{1,39}$/.test(value);
  }

  return true;
}

export function getClubbedNfts(nfts: Partial<SolAndSplToken>[]): ClubbedNfts[] {
  const finalData: { [collectionName: string]: ClubbedNfts } = {};
  nfts.forEach((nft) => {
    const metaData = nft.metaplexData?.offChainMetaData;
    const collectionName = metaData?.collection?.family || metaData?.symbol || "unknown token";
    const elem = finalData[collectionName];
    if (elem) {
      finalData[collectionName] = {
        ...elem,
        title: metaData?.symbol || "",
        count: elem.count + 1,
      };
    } else {
      finalData[collectionName] = {
        title: metaData?.name || "",
        count: 1,
        description: metaData?.description || "",
        img: metaData?.image || "",
        mints: [],
        collectionName,
      };
    }
    finalData[collectionName].mints.push(`${nft?.mintAddress?.toString()}`);
  });
  return Object.values(finalData);
}

// fee Estimation
// Generate Solana Transaction
export async function generateSPLTransaction(
  receiver: string,
  amount: number,
  selectedToken: Partial<SolAndSplToken>,
  sender: string,
  connection: Connection
): Promise<Transaction> {
  const transaction = new Transaction();
  const tokenMintAddress = selectedToken.mintAddress as string;
  const decimals = selectedToken.balance?.decimals || 0;
  const mintAccount = new PublicKey(tokenMintAddress);
  const signer = new PublicKey(sender); // add gasless transactions
  const sourceTokenAccount = await getAssociatedTokenAddress(mintAccount, signer, false);
  const receiverAccount = new PublicKey(receiver);

  let associatedTokenAccount = receiverAccount;
  try {
    associatedTokenAccount = await getAssociatedTokenAddress(new PublicKey(tokenMintAddress), receiverAccount, false);
  } catch (e) {
    log.warn("error getting associatedTokenAccount, account passed is possibly a token account");
  }

  const receiverAccountInfo = await connection.getAccountInfo(associatedTokenAccount);

  if (receiverAccountInfo?.owner?.toString() !== TOKEN_PROGRAM_ID.toString()) {
    const newAccount = await createAssociatedTokenAccountInstruction(
      new PublicKey(sender),
      associatedTokenAccount,
      receiverAccount,
      new PublicKey(tokenMintAddress)
    );
    transaction.add(newAccount);
  }
  const transferInstructions = createTransferCheckedInstruction(
    sourceTokenAccount,
    mintAccount,
    associatedTokenAccount,
    signer,
    amount,
    decimals,
    []
  );
  transaction.add(transferInstructions);

  transaction.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  transaction.feePayer = new PublicKey(sender);
  return transaction;
}

// Calculte balance changes after transaction simulation
export async function calculateChanges(
  connection: Connection,
  result: SimulatedTransactionResponse,
  selectedAddress: string,
  accountKeys: string[]
): Promise<AccountEstimation[]> {
  // filter out  address token (Token ProgramId ).
  // parse account data, filter selecteAddress as token holder
  const returnResult: AccountEstimation[] = [];
  const mintTokenAddress: string[] = [];
  const postTokenDetails: Account[] = [];

  // For all the accounts changes, filter out the token Account(post tx)
  result.accounts?.forEach((item, idx) => {
    if (!item) return;

    // there is possibility the account is a mintAccount which is also owned by TOKEN PROGRAM. Check data length to filter out
    const bufferData = Buffer.from(item.data[0], item.data[1] as BufferEncoding);
    if (TOKEN_PROGRAM_ID.equals(new PublicKey(item.owner)) && bufferData.length > MINT_SIZE) {
      const rawAccount = AccountLayout.decode(bufferData);
      const tokenDetail: Account = {
        address: new PublicKey(accountKeys[idx]),
        mint: rawAccount.mint,
        owner: rawAccount.owner,
        amount: rawAccount.amount,
        delegate: rawAccount.delegate,
        delegatedAmount: rawAccount.delegatedAmount,
        isInitialized: rawAccount.state > 0,
        isFrozen: rawAccount.state === 2,
        isNative: rawAccount.isNative > 0,
        closeAuthority: rawAccount.closeAuthority,
        /**
         * If the account is a native token account, it must be rent-exempt. The rent-exempt reserve is the amount that must
         * remain in the balance until the account is closed.
         */
        rentExemptReserve: null,
      };

      if (tokenDetail.owner.toBase58() === selectedAddress) {
        mintTokenAddress.push(tokenDetail.mint.toBase58());
        postTokenDetails.push(tokenDetail);
      }
    }
  });

  // Query current token accountInfo
  const queryPubKey = [
    new PublicKey(selectedAddress),
    ...mintTokenAddress.map((item) => new PublicKey(item)),
    ...postTokenDetails.map((item) => item.address),
  ];
  const queryAccounts = await connection.getMultipleAccountsInfo(queryPubKey);
  const signerAccount = queryAccounts[0];
  const mintAccounts = queryAccounts.slice(1, mintTokenAddress.length + 1);
  const tokenAccounts = queryAccounts.slice(mintTokenAddress.length + 1);

  const mintAccountInfos: RawMint[] = mintAccounts.map((item) => MintLayout.decode(Buffer.from(item?.data || [])));
  const preTokenDetails = tokenAccounts.map((item, _idx) => (item ? AccountLayout.decode(item.data) : null));

  // Check for holder's sol account balance changes
  const accIdx = accountKeys.findIndex((item) => item === selectedAddress);
  if (accIdx >= 0) {
    const solchanges = ((result.accounts?.at(accIdx)?.lamports || 0) - Number(signerAccount?.lamports)) / LAMPORTS_PER_SOL;
    returnResult.push({ changes: Number(solchanges.toFixed(7)), symbol: "SOL", mint: "", address: selectedAddress });
  }

  // calculate token account changes
  // compare post token account with current token account.
  postTokenDetails.forEach(async (item, idx) => {
    const mint = item.mint.toBase58();
    const symbol = addressSlicer(item.mint.toBase58());

    const { decimals } = mintAccountInfos[idx];
    const preTokenAmount = preTokenDetails[idx]?.amount || BigInt(0);
    const changes = Number(item.amount - preTokenAmount) / 10 ** decimals;

    returnResult.push({
      changes: Number(changes.toString()),
      symbol,
      mint,
      address: item.address.toBase58(),
    });
  });

  // add filter new interested program and its account
  log.info(returnResult);
  return returnResult;
}

// Simulate transaction's balance changes
export async function getEstimateBalanceChange(connection: Connection, tx: Transaction, signer: string): Promise<AccountEstimation[]> {
  try {
    // get writeable accounts from all instruction
    const accounts = tx.instructions.reduce((prev, current) => {
      // log.info(current.keys)
      current.keys.forEach((item) => {
        if (item.isWritable || item.isSigner) {
          prev.set(item.pubkey.toBase58(), item.pubkey);
        }
      });
      return prev;
    }, new Map<string, PublicKey>());

    log.info(tx instanceof Transaction);
    // add selected Account incase signer is just fee payer (instruction will not track fee payer)
    accounts.set(signer, new PublicKey(signer));

    // Simulate Transaction with Accounts
    const result = await connection.simulateTransaction(tx.compileMessage(), undefined, Array.from(accounts.values()));

    if (result.value.err) {
      throw new Error(result.value.err.toString());
    }
    // calculate diff of the token and sol
    return calculateChanges(connection, result.value, signer, Array.from(accounts.keys()));
  } catch (e) {
    log.warn(e);
    // if ((e as Error).message.match("Too many accounts provided; max 0")) log.warn("Unable to estimate balances");
    throw new Error("Failed to simulate transaction for balance change", e as Error);
  }
}

export async function calculateTxFee(message: Message, connection: Connection): Promise<{ blockHash: string; fee: number; height: number }> {
  const latestBlockHash = await connection.getLatestBlockhash("finalized");
  const blockHash = latestBlockHash.blockhash;
  const height = latestBlockHash.lastValidBlockHeight;
  const fee = await connection.getFeeForMessage(message);
  return { blockHash, fee: fee.value, height };
}

export function decodeAllInstruction(messages: string[], messageOnly: boolean) {
  const decoded: DecodedDataType[] = [];
  (messages as string[]).forEach((msg) => {
    let tx2: Transaction;
    if (messageOnly) {
      tx2 = Transaction.populate(Message.from(Buffer.from(msg, "hex")));
    } else {
      tx2 = Transaction.from(Buffer.from(msg, "hex"));
    }
    tx2.instructions.forEach((inst) => {
      decoded.push(decodeInstruction(inst));
    });
  });
  return decoded;
}

export function parsingTransferAmount(tx: Transaction, txFee: number, isGasless: boolean): FinalTxData | undefined {
  if (tx.instructions.length > 1) return undefined;
  if (!tx.instructions[0].programId.equals(SystemProgram.programId)) return undefined;
  if (SystemInstruction.decodeInstructionType(tx.instructions[0]) !== "Transfer") return undefined;
  const decoded = tx.instructions.map((inst) => {
    const decoded_inst = SystemInstruction.decodeTransfer(inst);
    return decoded_inst;
  });

  const from = decoded[0].fromPubkey;
  const to = decoded[0].toPubkey;

  const txAmount = decoded[0].lamports;

  const totalSolCost = new BigNumber(txFee).plus(new BigNumber(txAmount.toString())).div(LAMPORTS_PER_SOL);
  const finalTxData: FinalTxData = {
    slicedSenderAddress: "",
    slicedReceiverAddress: "",
    totalSolAmount: 0,
    totalSolFee: 0,
    totalFiatAmount: "",
    totalFiatFee: "",
    transactionType: "",
    totalSolCost: "",
    totalFiatCost: "",
    isGasless: false,
  };

  finalTxData.slicedSenderAddress = addressSlicer(from.toBase58());
  finalTxData.slicedReceiverAddress = addressSlicer(to.toBase58());
  finalTxData.totalSolAmount = new BigNumber(new BigNumber(txAmount.toString())).div(LAMPORTS_PER_SOL).toNumber();
  finalTxData.totalSolFee = new BigNumber(txFee).div(LAMPORTS_PER_SOL).toNumber();

  finalTxData.totalSolCost = totalSolCost.toString();
  finalTxData.transactionType = "";
  finalTxData.isGasless = isGasless;

  return finalTxData;
}
