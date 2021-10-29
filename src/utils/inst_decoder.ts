import { PublicKey, StakeInstruction, StakeProgram, SystemInstruction, SystemProgram, TransactionInstruction } from "@solana/web3.js";
// import {  } from "base58";
export type DecodedDataType = {
  type: string;
  data: { [key: string]: string | PublicKey | number | undefined };
};

export const decodeInstruction = (inst: TransactionInstruction): DecodedDataType => {
  if (inst.programId.equals(SystemProgram.programId)) {
    return decodeSystemInstruction(inst);
  } else if (inst.programId.equals(StakeProgram.programId)) {
    return decodeStakeInstruction(inst);
  } else {
    return decodeUnknownInstruction(inst);
  }
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
    type: "system" + type,
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
    type: "stake" + type,
    data: decoded,
  };
};

export const decodeUnknownInstruction = (inst: TransactionInstruction): DecodedDataType => {
  return {
    type: "Unknown",
    data: {
      programId: inst.programId.toBase58(),
      data: inst.data.toString("hex"),
    },
  };
};
