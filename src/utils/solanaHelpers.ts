import { parseURL, TransactionRequestURL } from "@solana/pay";
import {
  Account,
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
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
  PublicKey,
  SimulatedTransactionResponse,
  SystemInstruction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import { get, post } from "@toruslabs/http-helpers";
import BigNumber from "bignumber.js";
import log from "loglevel";

import { SNS, SOL } from "./enums";
import { DecodedDataType, decodeInstruction } from "./instructionDecoder";
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

  // we don't suppport key lookups for oauth ids on solana
  // if (selectedTypeOfLogin === GOOGLE) {
  //   return /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(value);
  // }
  // if (selectedTypeOfLogin === REDDIT) {
  //   return /^[\w-]+$/.test(value) && !/\s/.test(value) && value.length >= 3 && value.length <= 20;
  // }
  // if (selectedTypeOfLogin === DISCORD) {
  //   return /^\d*$/.test(value) && value.length === 18;
  // }

  // if (selectedTypeOfLogin === TWITTER) {
  //   return /^@?(\w){1,15}$/.test(value);
  // }

  // if (selectedTypeOfLogin === GITHUB) {
  //   return /^(?!.*(-{2}))(?!^-.*$)(?!^.*-$)[\w-]{1,39}$/.test(value);
  // }

  if (selectedTypeOfLogin === SNS) {
    return /sol$/.test(value);
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

export async function createSPLTransactionInstruction(
  connection: Connection,
  receiver: PublicKey,
  sender: PublicKey,
  selectedToken: Partial<SolAndSplToken>,
  amount: number
) {
  const tokenMintAddress = selectedToken.mintAddress as string;
  const decimals = selectedToken.balance?.decimals || 0;
  const mintAccount = new PublicKey(tokenMintAddress);
  const signer = new PublicKey(sender); // add gasless transactions
  const sourceTokenAccount = await getAssociatedTokenAddress(mintAccount, signer, false);
  let associatedTokenAccount = receiver;
  const instructions: TransactionInstruction[] = [];
  try {
    associatedTokenAccount = await getAssociatedTokenAddress(new PublicKey(tokenMintAddress), receiver, false);
  } catch (e) {
    log.warn("error getting associatedTokenAccount, account passed is possibly a token account");
  }

  const receiverAccountInfo = await connection.getAccountInfo(associatedTokenAccount);

  if (receiverAccountInfo?.owner?.toString() !== TOKEN_PROGRAM_ID.toString()) {
    const newAccount = createAssociatedTokenAccountInstruction(
      new PublicKey(sender),
      associatedTokenAccount,
      receiver,
      new PublicKey(tokenMintAddress)
    );
    instructions.push(newAccount);
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
  instructions.push(transferInstructions);
  return instructions;
}

// fee Estimation
// Generate Solana Transaction
export async function generateSPLTransaction(
  receiver: string,
  amount: number,
  selectedToken: Partial<SolAndSplToken>,
  sender: string,
  connection: Connection
): Promise<VersionedTransaction> {
  const instructions: TransactionInstruction[] = await createSPLTransactionInstruction(
    connection,
    new PublicKey(receiver),
    new PublicKey(sender),
    selectedToken,
    amount
  );

  const { blockhash } = await connection.getLatestBlockhash("finalized");
  const messageV0 = new TransactionMessage({
    payerKey: new PublicKey(sender),
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const versionedTransaction = new VersionedTransaction(messageV0);

  return versionedTransaction;
}

export async function burnAndCloseAccount(selectedAddress: string, associatedAddress: string, mint: string, connection: Connection) {
  // signer pub key
  const signer = new PublicKey(selectedAddress);
  const associatedAddressPublicKey = new PublicKey(associatedAddress);
  const mintPublickey = new PublicKey(mint);

  // determine the balance and decimals of the token to burn
  const getBalance = await connection.getTokenAccountBalance(associatedAddressPublicKey);
  const { decimals, uiAmount } = getBalance.value;

  // create the burn instruction
  const burnInstruction = createBurnCheckedInstruction(associatedAddressPublicKey, mintPublickey, signer, (uiAmount || 0) * 10 ** decimals, decimals);
  const closeAccountInstruction = createCloseAccountInstruction(associatedAddressPublicKey, signer, signer);

  // recent block hash
  const block = await connection.getLatestBlockhash("max");
  const instructions = [burnInstruction, closeAccountInstruction];

  const messageV0 = new TransactionMessage({
    payerKey: new PublicKey(selectedAddress),
    instructions,
    recentBlockhash: block.blockhash,
  }).compileToV0Message();

  // add the instructions to the transaction
  const transactionV0 = new VersionedTransaction(messageV0);

  return transactionV0;
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

      mintTokenAddress.push(tokenDetail.mint.toBase58());
      postTokenDetails.push(tokenDetail);
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

  // const mintAccountInfos: RawMint[] = mintAccounts.map((item) => MintLayout.decode(Buffer.from(item?.data || [])));
  const preTokenDetails = tokenAccounts.map((item, _idx) => (item ? AccountLayout.decode(item.data) : null));

  // Check for holder's sol account balance changes
  const accIdx = accountKeys.findIndex((item) => item === selectedAddress);
  if (accIdx >= 0) {
    const solchanges = ((result.accounts?.at(accIdx)?.lamports || 0) - Number(signerAccount?.lamports)) / LAMPORTS_PER_SOL;
    returnResult.push({ changes: Number(solchanges.toFixed(7)), symbol: "SOL", mint: "", address: selectedAddress, decimals: 9 });
  }

  // calculate token account changes
  // compare post token account with current token account.
  postTokenDetails.forEach(async (item, idx) => {
    // Track only tokenDetail related to selectedAddress (pre or post)
    const preTokenOwner = preTokenDetails[idx]?.owner.toBase58();
    const postTokenOwner = item.owner.toBase58();
    if (preTokenOwner === selectedAddress || postTokenOwner === selectedAddress) {
      let mint = item.mint.toBase58();
      const symbol = `${item.mint.toBase58().substring(0, 5)}...`;

      // default decimals
      let decimals = 9;
      const preTokenMint = preTokenDetails[idx]?.mint;
      // incase postTokenDetail's Mint Address is system program ( account closed )
      if (mintTokenAddress[idx] !== "11111111111111111111111111111111") {
        const mintInfo: RawMint = MintLayout.decode(Buffer.from(mintAccounts[idx]?.data || []));
        decimals = mintInfo.decimals;
      } else if (preTokenMint) {
        mint = preTokenMint.toBase58();
        const query = await connection.getMultipleAccountsInfo([preTokenMint]);
        const mintInfo: RawMint = MintLayout.decode(Buffer.from(query[0]?.data || []));
        decimals = mintInfo.decimals;
      }
      // else throw error ?

      // const { decimals } = mintAccountInfos[idx];
      let postAmount = item.amount;
      if (postTokenOwner !== selectedAddress) postAmount = BigInt(0);

      let preTokenAmount = preTokenDetails[idx]?.amount || BigInt(0);
      if (preTokenOwner !== selectedAddress) preTokenAmount = BigInt(0);

      const changes = Number(postAmount - preTokenAmount) / 10 ** decimals;

      returnResult.push({
        changes: Number(changes.toString()),
        symbol,
        mint,
        address: item.address.toBase58(),
        decimals,
      });
    }
  });

  // add filter new interested program and its account
  log.info(returnResult);
  return returnResult;
}

// Simulate transaction's balance changes
export async function getEstimateBalanceChange(connection: Connection, tx: VersionedTransaction, signer: string): Promise<AccountEstimation[]> {
  try {
    const transactionMessage = TransactionMessage.decompile(tx.message);
    // get writeable accounts from all instruction
    const accounts = transactionMessage.instructions.reduce((prev, current) => {
      // log.info(current.keys)
      current.keys.forEach((item) => {
        if (item.isWritable || item.isSigner) {
          prev.set(item.pubkey.toBase58(), item.pubkey);
        }
      });
      return prev;
    }, new Map<string, PublicKey>());

    // add selected Account incase signer is just fee payer (instruction will not track fee payer)
    accounts.set(signer, new PublicKey(signer));
    const additional = tx.message?.addressTableLookups?.map((address) => address.accountKey.toBase58()) || [];
    // Simulate Transaction with Accounts
    const addresses = Array.from(accounts.keys());
    const combinedAddress = [...addresses, ...additional];
    const result = await connection.simulateTransaction(tx, { accounts: { addresses: combinedAddress, encoding: "base64" } });

    if (result.value.err) {
      throw new Error(result.value.err.toString());
    }
    // calculate diff of the token and sol
    return calculateChanges(connection, result.value, signer, combinedAddress);
  } catch (e) {
    log.warn(e);
    // if ((e as Error).message.match("Too many accounts provided; max 0")) log.warn("Unable to estimate balances");
    throw new Error("Failed to simulate transaction for balance change", e as Error);
  }
}

export async function calculateTxFee(message: VersionedMessage, connection: Connection): Promise<{ blockHash: string; height: number; fee: number }> {
  const latestBlockHash = await connection.getLatestBlockhash("finalized");
  const blockHash = latestBlockHash.blockhash;
  const height = latestBlockHash.lastValidBlockHeight;

  const legacyMessage = TransactionMessage.decompile(message).compileToLegacyMessage();

  const fee = await connection.getFeeForMessage(legacyMessage);
  return { blockHash, height, fee: fee.value || 0 };
}

export function decodeAllInstruction(messages: string[], messageOnly: boolean) {
  const decoded: DecodedDataType[] = [];
  (messages as string[]).forEach((msg) => {
    let tx2: VersionedTransaction;
    if (messageOnly) {
      const msgObj = VersionedMessage.deserialize(Buffer.from(msg as string, "hex"));
      tx2 = new VersionedTransaction(msgObj); // only for instuctions
    } else {
      tx2 = VersionedTransaction.deserialize(Buffer.from(msg as string, "hex"));
    }
    const { instructions } = TransactionMessage.decompile(tx2.message);
    instructions.forEach((inst) => {
      decoded.push(decodeInstruction(inst));
    });
  });
  return decoded;
}

export function parsingTransferAmount(tx: VersionedTransaction, txFee: number, isGasless: boolean): FinalTxData | undefined {
  const { instructions } = TransactionMessage.decompile(tx.message);

  if (instructions.length > 1) return undefined;
  if (!instructions[0].programId.equals(SystemProgram.programId)) return undefined;
  if (SystemInstruction.decodeInstructionType(instructions[0]) !== "Transfer") return undefined;
  const decoded = instructions.map((inst) => {
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

// SolanaPay
export const validateUrlTransactionSignature = (transaction: Transaction, selectedAddress: string) => {
  let signRequired = false;
  transaction.signatures.forEach((sig) => {
    if (sig.signature === null && sig.publicKey.toBase58() !== selectedAddress) throw new Error("Merchant Signature Verifcation Failed");
    signRequired = signRequired || sig.publicKey.toBase58() === selectedAddress;
  });
  if (!signRequired) throw new Error("Wallet Signature Not Required");
  transaction.serialize({ requireAllSignatures: false });
};

export const parseSolanaPayRequestLink = async (request: string, account: string, connection: Connection) => {
  log.info(request);
  const { label, message, link } = parseURL(request) as TransactionRequestURL;
  // get link
  // return {"label":"<label>","icon":"<icon>"}
  // update label and icon on tx display
  const getResult = await get<{ label: string; icon: string }>(link.toString());
  // post link
  // body {"account":"<account>"}
  // return {"transaction":"<transaction>"} (base64)
  const postResult = await post<{ transaction: string; message?: string }>(link.toString(), { account });

  const transaction = Transaction.from(Buffer.from(postResult.transaction, "base64"));
  const decodedInst = transaction.instructions.map((inst) => decodeInstruction(inst));
  // assign transaction object

  if (transaction.signatures.length === 0) {
    log.info("empty signature");
    transaction.feePayer = new PublicKey(account);
    const block = await connection.getLatestBlockhash();
    transaction.lastValidBlockHeight = block.lastValidBlockHeight;
    transaction.recentBlockhash = block.blockhash;
  } else {
    validateUrlTransactionSignature(transaction, account);
  }

  return { transaction, decodedInst, message: message || postResult.message, label: label || getResult.label, icon: getResult.icon, link };
};
