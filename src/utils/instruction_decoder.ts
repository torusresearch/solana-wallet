import * as bors from "@project-serum/borsh";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, StakeInstruction, StakeProgram, SystemInstruction, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import BN from "bignumber.js";

export type DecodedDataType = {
  type: string;
  data: { [key: string]: string | PublicKey | number | undefined | null };
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
      return { type: "", data: {} };
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
      return { type: "", data: {} };
  }

  //   if (!decoded || (decoded.fromPubkey && !publicKey.equals(decoded.fromPubkey))) {
  //     return;
  //   }

  return {
    type: `stake${type}`,
    data: decoded,
  };
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
  const decoded_data = TokenInstructionLayout.decode(instruction.data) as TokenInstructionLayoutType;
  if ("initializeMint" in decoded_data) {
    const type = "initializeMint";
    const params = {
      decimals: decoded_data.initializeMint.decimals,
      mint: instruction.keys[0].pubkey,
      mintAuthority: decoded_data.initializeMint.mintAuthority,
      freezeAuthority: decoded_data.initializeMint.freezeAuthority,
    };
    return { type, data: params };
  } else if ("initializeAccount" in decoded_data) {
    const type = "initializeAccount";
    const params = {
      account: instruction.keys[0].pubkey,
      mint: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
    };
    return { type, data: params };
  } else if ("transfer" in decoded_data) {
    const type = "transfer";
    const params = {
      source: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decoded_data.transfer.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("approve" in decoded_data) {
    const type = "approve";
    const params = {
      source: instruction.keys[0].pubkey,
      delegate: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decoded_data.approve.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("revoke" in decoded_data) {
    const type = "revoke";
    const params = {
      source: instruction.keys[0].pubkey,
      owner: instruction.keys[1].pubkey,
    };
    return { type, data: params };
  } else if ("setAuthority" in decoded_data) {
    const type = "setAuthority";
    const params = {
      target: instruction.keys[0].pubkey,
      currentAuthority: instruction.keys[1].pubkey,
      newAuthority: decoded_data.setAuthority.newAuthority,
      authorityType: decoded_data.setAuthority.authorityType,
    };
    return { type, data: params };
  } else if ("mintTo" in decoded_data) {
    const type = "mintTo";
    const params = {
      mint: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      mintAuthority: instruction.keys[2].pubkey,
      amount: decoded_data.mintTo.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("burn" in decoded_data) {
    const type = "burn";
    const params = {
      source: instruction.keys[0].pubkey,
      mint: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decoded_data.burn.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("closeAccount" in decoded_data) {
    const type = "closeAccount";
    const params = {
      source: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
    };
    return { type, data: params };
  } else if ("transferChecked" in decoded_data) {
    const type = "transfer";
    const params = {
      source: instruction.keys[0].pubkey,
      destination: instruction.keys[2].pubkey,
      owner: instruction.keys[3].pubkey,
      amount: decoded_data.transferChecked.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("approveChecked" in decoded_data) {
    const type = "approve";
    const params = {
      source: instruction.keys[0].pubkey,
      delegate: instruction.keys[2].pubkey,
      owner: instruction.keys[3].pubkey,
      amount: decoded_data.approveChecked.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("mintToChecked" in decoded_data) {
    const type = "mintTo";
    const params = {
      mint: instruction.keys[0].pubkey,
      destination: instruction.keys[1].pubkey,
      mintAuthority: instruction.keys[2].pubkey,
      amount: decoded_data.mintToChecked.amount.toNumber(),
    };
    return { type, data: params };
  } else if ("burnChecked" in decoded_data) {
    const type = "burn";
    const params = {
      source: instruction.keys[0].pubkey,
      mint: instruction.keys[1].pubkey,
      owner: instruction.keys[2].pubkey,
      amount: decoded_data.burnChecked.amount.toNumber(),
    };
    return { type, data: params };
  }
  throw new Error("Unsupported token instruction type");
}

export const decodeInstruction = (instruction: TransactionInstruction): DecodedDataType => {
  if (instruction.programId.equals(SystemProgram.programId)) {
    return decodeSystemInstruction(instruction);
  } else if (instruction.programId.equals(StakeProgram.programId)) {
    return decodeStakeInstruction(instruction);
  } else if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
    return decodeTokenInstruction(instruction);
  }
  return decodeUnknownInstruction(instruction);
};
