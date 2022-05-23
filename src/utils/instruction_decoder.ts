import * as bors from "@project-serum/borsh";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, StakeInstruction, StakeProgram, SystemInstruction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import { SolanaToken, TokenInfoController, TokenTransferData } from "@toruslabs/solana-controllers";
import BN from "bignumber.js";
import log from "loglevel";

export type DecodedDataType = {
  type: string;
  data: { [key: string]: string | PublicKey | number | BigInt | undefined | null };
};

export const decodeUnknownInstruction = (instruction: TransactionInstruction): DecodedDataType => {
  return {
    type: "Unknown",
    data: {
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString("hex"),
    },
  };
};

export const decodeSystemInstruction = (inst: TransactionInstruction): DecodedDataType => {
  // get layout
  let decoded;
  const type = SystemInstruction.decodeInstructionType(inst);
  switch (type) {
    case "Create":
      decoded = SystemInstruction.decodeCreateAccount(inst);
      break;
    case "CreateWithSeed":
      decoded = SystemInstruction.decodeCreateWithSeed(inst);
      break;
    case "Allocate":
      decoded = SystemInstruction.decodeAllocate(inst);
      break;
    case "AllocateWithSeed":
      decoded = SystemInstruction.decodeAllocateWithSeed(inst);
      break;
    case "Assign":
      decoded = SystemInstruction.decodeAssign(inst);
      break;
    case "AssignWithSeed":
      decoded = SystemInstruction.decodeAssignWithSeed(inst);
      break;
    case "Transfer":
      decoded = SystemInstruction.decodeTransfer(inst);
      break;
    case "AdvanceNonceAccount":
      decoded = SystemInstruction.decodeNonceAdvance(inst);
      break;
    case "WithdrawNonceAccount":
      decoded = SystemInstruction.decodeNonceWithdraw(inst);
      break;
    case "InitializeNonceAccount":
      decoded = SystemInstruction.decodeNonceInitialize(inst);
      break;
    case "AuthorizeNonceAccount":
      decoded = SystemInstruction.decodeNonceAuthorize(inst);
      break;
    default:
      return decodeUnknownInstruction(inst);
  }

  //   if (!decoded || (decoded.fromPubkey && !publicKey.equals(decoded.fromPubkey))) {
  //     return;
  //   }

  return {
    type: `system${type}`,
    data: decoded,
  };
};

export const decodeStakeInstruction = (inst: TransactionInstruction): DecodedDataType => {
  let decoded: DecodedDataType["data"] = {};
  const type = StakeInstruction.decodeInstructionType(inst);
  switch (type) {
    case "AuthorizeWithSeed": {
      const temp = StakeInstruction.decodeAuthorizeWithSeed(inst);
      decoded.stakeAuthorizationType = temp.stakeAuthorizationType.index;
      decoded.authorityBase = temp.authorityBase;
      decoded.authorityOwner = temp.authorityOwner;
      decoded.authoritySeed = temp.authoritySeed;
      decoded.custodianPubkey = temp.custodianPubkey;
      decoded.newAuthorizedPubkey = temp.newAuthorizedPubkey;
      decoded.stakePubkey = temp.stakePubkey;
      break;
    }
    case "Authorize": {
      const { stakeAuthorizationType, custodianPubkey, stakePubkey, authorizedPubkey, newAuthorizedPubkey } = StakeInstruction.decodeAuthorize(inst);
      decoded.stakeAuthorizationType = stakeAuthorizationType.index;
      decoded.custodianPubkey = custodianPubkey;
      decoded.authorizedPubkey = authorizedPubkey;
      decoded.stakePubkey = stakePubkey;
      decoded.newAuthorizedPubkey = newAuthorizedPubkey;
      break;
    }
    case "Deactivate":
      decoded = StakeInstruction.decodeDeactivate(inst);
      break;
    case "Delegate":
      decoded = StakeInstruction.decodeDelegate(inst);
      break;
    case "Initialize": {
      const { lockup, authorized, stakePubkey } = StakeInstruction.decodeInitialize(inst);
      const temp: { [key: string]: string } = {};
      // Lockup inactive if all zeroes
      if (lockup && lockup.unixTimestamp === 0 && lockup.epoch === 0 && lockup.custodian.equals(PublicKey.default)) {
        temp.lockup = "Inactive";
      } else if (lockup) {
        temp.lockup = `unixTimestamp: ${lockup.unixTimestamp.toLocaleString()}, custodian: ${lockup.epoch.toString()}, custodian: ${lockup.custodian.toBase58()}`;
      }
      // flatten authorized to allow address render
      temp.authorizedStaker = authorized.staker.toBase58();
      temp.authorizedWithdrawer = authorized.withdrawer.toBase58();
      temp.stakePubkey = stakePubkey.toBase58();
      decoded = temp;
      break;
    }
    case "Split":
      decoded = StakeInstruction.decodeSplit(inst);
      break;
    case "Withdraw": {
      decoded = StakeInstruction.decodeWithdraw(inst);
      break;
    }
    default:
      return decodeUnknownInstruction(inst);
  }

  //   if (!decoded || (decoded.fromPubkey && !publicKey.equals(decoded.fromPubkey))) {
  //     return;
  //   }

  return {
    type: `stake${type}`,
    data: decoded,
  };
};

export declare type TokenInstructionLayoutType =
  | { initializeMint: { decimals: number; mintAuthority: PublicKey; freezeAuthority: PublicKey | null } }
  | { initializeAccount: unknown }
  | { initializeMultisig: { m: number } }
  | { transfer: { amount: BN } }
  | { approve: { amount: BN } }
  | { revoke: unknown }
  | { setAuthority: { authorityType: number; newAuthority: PublicKey | null } }
  | { mintTo: { amount: BN } }
  | { burn: { amount: BN } }
  | { closeAccount: unknown }
  | { freezeAccount: unknown }
  | { thawAccount: unknown }
  | { transferChecked: { amount: BN; decimals: number } }
  | { approveChecked: { amount: BN; decimals: number } }
  | { mintToChecked: { amount: BN; decimals: number } }
  | { burnChecked: { amount: BN; decimals: number } };

const TokenInstructionLayout = bors.rustEnum([
  bors.struct([bors.u8("decimals"), bors.publicKey("mintAuthority"), bors.option(bors.publicKey(), "freezeAuthority")], "initializeMint"),
  bors.struct([], "initializeAccount"),
  bors.struct([bors.u8("m")], "initializeMultisig"),
  bors.struct([bors.u64("amount")], "transfer"),
  bors.struct([bors.u64("amount")], "approve"),
  bors.struct([], "revoke"),
  bors.struct([bors.u8("authorityType"), bors.option(bors.publicKey(), "newAuthority")], "setAuthority"),
  bors.struct([bors.u64("amount")], "mintTo"),
  bors.struct([bors.u64("amount")], "burn"),
  bors.struct([], "closeAccount"),
  bors.struct([], "freezeAccount"),
  bors.struct([], "thawAccount"),
  bors.struct([bors.u64("amount"), bors.u8("decimals")], "transferChecked"),
  bors.struct([bors.u64("amount"), bors.u8("decimals")], "approveChecked"),
  bors.struct([bors.u64("amount"), bors.u8("decimals")], "mintToChecked"),
  bors.struct([bors.u64("amount"), bors.u8("decimals")], "burnChecked"),
]);

function decodeTokenInstruction(instruction: TransactionInstruction): DecodedDataType {
  const decodedData = TokenInstructionLayout.decode(instruction.data) as TokenInstructionLayoutType;
  if ("initializeMint" in decodedData) {
    const type = "initializeMint";
    const params = {
      decimals: decodedData.initializeMint.decimals,
      mint: instruction.keys[0].pubkey,
      mintAuthority: decodedData.initializeMint.mintAuthority,
      freezeAuthority: decodedData.initializeMint.freezeAuthority,
    };
    return { type, data: params };
  }
  if ("initializeAccount" in decodedData) {
    const type = "initializeAccount";
    const params = {
      account: instruction.keys[0].pubkey,
      mint: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
    };
    return { type, data: params };
  }
  if ("transfer" in decodedData) {
    const type = "transfer";
    const params = {
      source: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decodedData.transfer.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("approve" in decodedData) {
    const type = "approve";
    const params = {
      source: instruction.keys[0].pubkey,
      delegate: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decodedData.approve.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("revoke" in decodedData) {
    const type = "revoke";
    const params = {
      source: instruction.keys[0].pubkey,
      owner: instruction.keys[1].pubkey,
    };
    return { type, data: params };
  }
  if ("setAuthority" in decodedData) {
    const type = "setAuthority";
    const params = {
      target: instruction.keys[0].pubkey,
      currentAuthority: instruction.keys[1].pubkey,
      newAuthority: decodedData.setAuthority.newAuthority,
      authorityType: decodedData.setAuthority.authorityType,
    };
    return { type, data: params };
  }
  if ("mintTo" in decodedData) {
    const type = "mintTo";
    const params = {
      mint: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      mintAuthority: instruction.keys[2].pubkey,
      amount: decodedData.mintTo.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("burn" in decodedData) {
    const type = "burn";
    const params = {
      source: instruction.keys[0].pubkey,
      mint: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decodedData.burn.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("closeAccount" in decodedData) {
    const type = "closeAccount";
    const params = {
      source: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
    };
    return { type, data: params };
  }
  if ("transferChecked" in decodedData) {
    const type = "transferChecked";
    const params = {
      source: instruction.keys[0].pubkey,
      destination: instruction.keys[2].pubkey,
      owner: instruction.keys[3].pubkey,
      amount: decodedData.transferChecked.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("approveChecked" in decodedData) {
    const type = "approveChecked";
    const params = {
      source: instruction.keys[0].pubkey,
      delegate: instruction.keys[2].pubkey,
      owner: instruction.keys[3].pubkey,
      amount: decodedData.approveChecked.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("mintToChecked" in decodedData) {
    const type = "mintToChecked";
    const params = {
      mint: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      mintAuthority: instruction.keys[2].pubkey,
      amount: decodedData.mintToChecked.amount.toNumber(),
    };
    return { type, data: params };
  }
  if ("burnChecked" in decodedData) {
    const type = "burnChecked";
    const params = {
      source: instruction.keys[0].pubkey,
      mint: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decodedData.burnChecked.amount.toNumber(),
    };
    return { type, data: params };
  }
  // throw new Error("Unsupported token instruction type");
  return decodeUnknownInstruction(instruction);
}

export const decodeInstruction = (instruction: TransactionInstruction): DecodedDataType => {
  try {
    if (instruction.programId.equals(SystemProgram.programId)) {
      return decodeSystemInstruction(instruction);
    }
    if (instruction.programId.equals(StakeProgram.programId)) {
      return decodeStakeInstruction(instruction);
    }
    if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
      return decodeTokenInstruction(instruction);
    }
  } catch (err) {
    log.error(err);
  }
  return decodeUnknownInstruction(instruction);
};

export const constructTokenData = (
  tokenPriceMap: { [mintAddress: string]: { [currency: string]: number } },
  infoState: TokenInfoController["state"],
  rawTransaction?: string,
  tokenMap: SolanaToken[] = []
): TokenTransferData | undefined => {
  if (!tokenMap || !rawTransaction) return undefined;

  // reconstruct Transaction as transaction object function is not accessible
  const { instructions } = Transaction.from(Buffer.from(rawTransaction || "", "hex"));

  // Expect SPL token transfer transaction have only 1 instruction
  if (instructions.length === 1) {
    if (TOKEN_PROGRAM_ID.equals(instructions[0].programId)) {
      const decoded = decodeTokenInstruction(instructions[0]);
      // There are transfer and transferChecked type
      if (decoded.type.includes("transfer")) {
        const from = new PublicKey(decoded.data.source || "").toBase58();
        const to = new PublicKey(decoded.data.destination || "").toBase58();

        // get token's info data from token account address
        const tokenState =
          tokenMap.find((x) => new PublicKey(x.tokenAddress).toBase58() === to) ||
          tokenMap.find((x) => new PublicKey(x.tokenAddress).toBase58() === from);

        // if tokenState (info) not found, assume unknown transaction
        if (!tokenState) return undefined;
        // Expect owner is signer (selectedAddress) as only signer spl transction go thru this function
        let symbol = tokenState.isFungible
          ? infoState.tokenInfoMap[tokenState.mintAddress]?.symbol
          : infoState.metaplexMetaMap[tokenState.mintAddress]?.symbol;
        if (!symbol) symbol = addressSlicer(tokenState.mintAddress);

        const logoURI = tokenState.isFungible
          ? infoState.tokenInfoMap[tokenState.mintAddress]?.logoURI
          : infoState.metaplexMetaMap[tokenState.mintAddress]?.offChainMetaData?.image;

        const price = tokenPriceMap[tokenState.mintAddress];
        return {
          tokenName: symbol,
          amount: decoded.data.amount as number,
          decimals: tokenState.balance?.decimals as number,
          from: new PublicKey(decoded.data.owner || "").toBase58(),
          to,
          mintAddress: tokenState.mintAddress || "",
          logoURI: logoURI || "",
          conversionRate: price || {},
        };
      }
    }
  }
  return undefined;
};
