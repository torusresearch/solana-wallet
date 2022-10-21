import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import assert from "assert";
import nock from "nock";

import * as solanaHelper from "@/utils/solanaHelpers";

import { mockConnection, mockGetConnection } from "./mockConnection";
import { mockClubbedNFTs, mockNFTs, sKeyPair } from "./mockData";
import nockRequest from "./nockRequest";

const checkPubKey = (transaction: VersionedTransaction, publicKey: PublicKey) => {
  const signerPubkeys = transaction.message.staticAccountKeys.slice(0, transaction.message.header.numRequiredSignatures);
  const signer = signerPubkeys.find((pubkey) => pubkey.equals(publicKey));
  return signer;
};

describe("solana helper util", () => {
  beforeEach(async () => {
    nockRequest();
  });
  afterEach(() => {
    nock.cleanAll();
  });
  const transferInstruction = () => {
    return SystemProgram.transfer({
      fromPubkey: sKeyPair[0].publicKey,
      toPubkey: sKeyPair[1].publicKey,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    });
  };
  const createTransactionV = () => {
    const messageV0 = new TransactionMessage({
      payerKey: sKeyPair[0].publicKey,
      instructions: [transferInstruction()],
      recentBlockhash: sKeyPair[0].publicKey.toBase58(),
    }).compileToV0Message();
    const transactionV0 = new VersionedTransaction(messageV0);
    const { instructions } = TransactionMessage.decompile(transactionV0.message);
    return { instructions, transactionV0 };
  };
  it("parsingTransferAmount", async () => {
    const { transactionV0 } = createTransactionV();
    const result = await solanaHelper.parsingTransferAmount(transactionV0, 1, false, mockConnection as Connection);
    const slicedSenderAddress = addressSlicer(sKeyPair[0].publicKey.toBase58());
    const slicedReceiverAddress = addressSlicer(sKeyPair[1].publicKey.toBase58());
    const assertResult = {
      isGasless: false,
      slicedReceiverAddress,
      slicedSenderAddress,
      totalFiatAmount: "",
      totalFiatCost: "",
      totalFiatFee: "",
      totalSolAmount: 0.1,
      totalSolCost: "0.100000001",
      totalSolFee: 1e-9,
      transactionType: "",
    };
    assert.deepEqual(result, assertResult);
  });
  it("calculateTxFee", async () => {
    const { transactionV0 } = createTransactionV();

    const result = await solanaHelper.calculateTxFee(transactionV0.message, mockGetConnection());
    assert.deepEqual(result.fee, 1);
  });
  // it("getEstimateBalanceChange", async () => {
  //   const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey });
  //   tx.add(transferInstruction());
  //   const result = await solanaHelper.getEstimateBalanceChange(mockGetConnection(), tx, sKeyPair[0].publicKey.toBase58());
  //   assert.deepEqual(result, [
  //     {
  //       address: "7dpVde1yJCzpz2bKNiXWh7sBJk7PFvv576HnyFCrgNyW",
  //       changes: 0,
  //       decimals: 9,
  //       mint: "",
  //       symbol: "SOL",
  //     },
  //   ]);
  // });
  // it("calculateChanges", async () => {
  //   const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey });
  //   tx.add(transferInstruction());
  //   const result = await solanaHelper.calculateChanges(mockGetConnection(), mockSimulateTransaction, "7dpVde1yJCzpz2bKNiXWh7sBJk7PFvv576HnyFCrgNyW", [
  //     "7dpVde1yJCzpz2bKNiXWh7sBJk7PFvv576HnyFCrgNyW",
  //     "6bS8uykyBg1dC5E4fatWaJC177KTcyW5GsGtUvNq3RPz",
  //   ]);
  //   assert.deepEqual(result, [
  //     {
  //       address: "7dpVde1yJCzpz2bKNiXWh7sBJk7PFvv576HnyFCrgNyW",
  //       changes: 0,
  //       decimals: 9,
  //       mint: "",
  //       symbol: "SOL",
  //     },
  //   ]);
  // });
  it("getClubbedNfts", async () => {
    const result = await solanaHelper.getClubbedNfts(mockNFTs);
    assert.deepEqual(result, mockClubbedNFTs);
  });
  it("ruleVerifierId", () => {
    const solResult = solanaHelper.ruleVerifierId("sol", sKeyPair[0].publicKey.toBase58());
    assert.deepEqual(solResult, true);
    const googleResult = solanaHelper.ruleVerifierId("google", "test@gmail.com");
    assert.deepEqual(googleResult, true);
    const redditResult = solanaHelper.ruleVerifierId("reddit", "test123");
    assert.deepEqual(redditResult, true);
    const twitterResult = solanaHelper.ruleVerifierId("twitter", "testweb3");
    assert.deepEqual(twitterResult, true);
    const githubResult = solanaHelper.ruleVerifierId("github", "testweb3");
    assert.deepEqual(githubResult, true);
  });
  it("generateSPLTransaction", async () => {
    const result = await solanaHelper.generateSPLTransaction(
      sKeyPair[1].publicKey.toBase58(),
      1,
      mockNFTs[0],
      sKeyPair[0].publicKey.toBase58(),
      mockGetConnection()
    );
    const signers = checkPubKey(result, sKeyPair[0].publicKey);
    assert.notEqual(signers, sKeyPair[0].publicKey);
    const associatedTokenAccount = await getAssociatedTokenAddress(new PublicKey(mockNFTs[0].mintAddress), sKeyPair[1].publicKey, false);
    const associatedTokenResult = await solanaHelper.generateSPLTransaction(
      associatedTokenAccount.toBase58(),
      1,
      mockNFTs[0],
      sKeyPair[0].publicKey.toBase58(),
      mockGetConnection()
    );
    const { instructions } = TransactionMessage.decompile(associatedTokenResult.message);
    const { instructions: resultInstructions } = TransactionMessage.decompile(result.message);

    assert.deepEqual(resultInstructions[0].keys[2].pubkey.toBase58(), sKeyPair[1].publicKey.toBase58());
    assert.deepEqual(instructions[0].keys[2].pubkey.toBase58(), associatedTokenAccount.toBase58());
    // changes in instruction between associated token account and normal sol account
    assert.notDeepEqual(JSON.stringify(associatedTokenResult), JSON.stringify(result));
  });
  it("decodeAllInstruction", async () => {
    const decodeInstructions = [transferInstruction()];

    [1, 2].forEach(() => decodeInstructions.push(transferInstruction()));

    const messageV0 = new TransactionMessage({
      payerKey: sKeyPair[0].publicKey,
      instructions: decodeInstructions,
      recentBlockhash: sKeyPair[0].publicKey.toBase58(),
    }).compileToV0Message();
    const transactionV0 = new VersionedTransaction(messageV0);

    // const message = [
    //   "01000102956e41697918a4b3b7800d9292e50a9050443f53bef96296b5dced3f8dec93410000000000000000000000000000000000000000000000000000000000000000da56c1e43b1f54b5029b286ab6b692b80bf13e98e6a4cadf12b8769d7098138001010200000c020000002c4a970200000000",
    //   "01000102956e41697918a4b3b7800d9292e50a9050443f53bef96296b5dced3f8dec93410000000000000000000000000000000000000000000000000000000000000000da56c1e43b1f54b5029b286ab6b692b80bf13e98e6a4cadf12b8769d7098138001010200000c0200000057cf140500000000",
    // ];
    const result = await solanaHelper.decodeAllInstruction(
      [Buffer.from(transactionV0.serialize()).toString("hex")],
      false,
      mockConnection as Connection
    );
    // console.log(result);
    // console.log({ result: JSON.stringify(result) });
    assert.deepEqual(result.length, 3);
  });
});
