import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  DecodedApproveCheckedInstruction,
  DecodedApproveInstruction,
  DecodedBurnCheckedInstruction,
  DecodedBurnInstruction,
  DecodedCloseAccountInstruction,
  DecodedInitializeAccountInstruction,
  DecodedInitializeMintInstruction,
  DecodedMintToCheckedInstruction,
  DecodedMintToInstruction,
  DecodedRevokeInstruction,
  DecodedSetAuthorityInstruction,
  DecodedTransferCheckedInstruction,
  DecodedTransferInstruction,
  decodeInstruction as decodeTokenInstruction1,
  TOKEN_PROGRAM_ID,
  TokenInstruction,
} from "@solana/spl-token";
import {
  PublicKey,
  StakeInstruction,
  StakeProgram,
  SystemInstruction,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import { decompile, SolanaToken, TokenInfoController, TokenTransactionData } from "@toruslabs/solana-controllers";
import log from "loglevel";

// Custom address
const BURN_ADDRESS_INC = "1burn1nerator111111111111111111111111111111";

export type DecodedDataType = {
  type: string;
  data: { [key: string]: string | PublicKey | number | bigint | undefined | null };
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

function decodeTokenInstruction(instruction: TransactionInstruction): DecodedDataType {
  const decoded = decodeTokenInstruction1(instruction);
  if (decoded.data.instruction === TokenInstruction.InitializeMint) {
    const type = "initializeMint";
    const params = {
      mint: (decoded as DecodedInitializeMintInstruction).keys.mint.pubkey,
      decimals: decoded.data.decimals,
      mintAuthority: decoded.data.mintAuthority,
      freezeAuthority: decoded.data.freezeAuthority,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.InitializeAccount) {
    const type = "initializeAccount";
    const ikeys = (decoded as DecodedInitializeAccountInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      mint: ikeys.mint.pubkey,
      owner: ikeys.owner.pubkey,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.Transfer) {
    const type = "transfer";
    const ikeys = (decoded as DecodedTransferInstruction).keys;
    const params = {
      source: ikeys.source.pubkey,
      destination: ikeys.destination.pubkey,
      owner: ikeys.owner.pubkey,
      // Todo: use back bigint
      amount: Number(decoded.data.amount),
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.Approve) {
    const type = "approve";
    const ikeys = (decoded as DecodedApproveInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      delegate: ikeys.delegate.pubkey,
      owner: ikeys.owner.pubkey,
      amount: decoded.data.amount,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.Revoke) {
    const type = "revoke";
    const ikeys = (decoded as DecodedRevokeInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      owner: ikeys.owner.pubkey,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.SetAuthority) {
    const type = "setAuthority";
    const ikeys = (decoded as DecodedSetAuthorityInstruction).keys;
    const params = {
      target: ikeys.account.pubkey,
      currentAuthority: ikeys.currentAuthority.pubkey,
      newAuthority: decoded.data.newAuthority,
      authorityType: decoded.data.authorityType,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.MintTo) {
    const type = "mintTo";
    const ikeys = (decoded as DecodedMintToInstruction).keys;
    const params = {
      mint: ikeys.mint.pubkey,
      destination: ikeys.destination.pubkey,
      authority: ikeys.authority.pubkey,
      amount: decoded.data.amount,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.Burn) {
    const type = "burn";
    const ikeys = (decoded as DecodedBurnInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      mint: ikeys.mint.pubkey,
      owner: ikeys.owner.pubkey,
      amount: decoded.data.amount,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.CloseAccount) {
    const type = "closeAccount";
    const ikeys = (decoded as DecodedCloseAccountInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      destination: ikeys.destination.pubkey,
      authority: ikeys.authority.pubkey,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.TransferChecked) {
    const type = "transferChecked";
    const ikeys = (decoded as DecodedTransferCheckedInstruction).keys;
    const params = {
      source: ikeys.source.pubkey,
      destination: ikeys.destination.pubkey,
      owner: ikeys.owner.pubkey,
      // Todo: use back bigint
      amount: Number(decoded.data.amount),
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.ApproveChecked) {
    const type = "approveChecked";
    const ikeys = (decoded as DecodedApproveCheckedInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      delegate: ikeys.delegate.pubkey,
      owner: ikeys.owner.pubkey,
      amount: decoded.data.amount,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.MintToChecked) {
    const type = "mintToChecked";
    const ikeys = (decoded as DecodedMintToCheckedInstruction).keys;
    const params = {
      mint: ikeys.mint.pubkey,
      destination: ikeys.destination.pubkey,
      authority: ikeys.authority.pubkey,
      amount: decoded.data.amount,
    };
    return { type, data: params };
  }
  if (decoded.data.instruction === TokenInstruction.BurnChecked) {
    const type = "burnChecked";
    const ikeys = (decoded as DecodedBurnCheckedInstruction).keys;
    const params = {
      account: ikeys.account.pubkey,
      mint: ikeys.mint.pubkey,
      owner: ikeys.owner.pubkey,
      amount: decoded.data.amount,
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

// in case of transfer/ burn
export const constructTokenData = (
  tokenPriceMap: { [mintAddress: string]: { [currency: string]: number } },
  infoState: TokenInfoController["state"],
  vTransaction?: VersionedTransaction,
  tokenMap: SolanaToken[] = []
): TokenTransactionData | undefined => {
  try {
    if (!tokenMap || !vTransaction) return undefined;

    // reconstruct Transaction as transaction object function is not accessible
    const instructions = decompile(vTransaction.message);

    // TODO: Need to Decode for Token Account Creation and Transfer Instruction which bundle in 1 Transaction.
    let interestedTransactionInstructionidx = -1;
    const instructionLength = instructions.length;

    if (instructionLength > 1 && instructionLength <= 3) {
      const createInstructionIdx = instructions.findIndex((inst) => {
        if (inst.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
          return inst.data.length === 0;
        }
        return false;
      });
      if (createInstructionIdx >= 0) {
        const transferIdx = instructions.findIndex((inst) => {
          if (inst.programId.equals(TOKEN_PROGRAM_ID)) {
            const parseInst = decodeTokenInstruction(inst);
            return ["transfer", "transferChecked"].includes(parseInst.type);
          }
          return false;
        });
        interestedTransactionInstructionidx = transferIdx;
      } else {
        const burnIndex = instructions.findIndex((inst) => {
          if (inst.programId.equals(TOKEN_PROGRAM_ID)) {
            const parseInst = decodeTokenInstruction(inst);
            return ["burn", "burnChecked"].includes(parseInst.type);
          }
          return false;
        });
        interestedTransactionInstructionidx = burnIndex;
      }
    }

    // Expect SPL token transfer transaction have only 1 instruction
    if (instructions.length === 1 || interestedTransactionInstructionidx >= 0) {
      if (instructions.length === 1) interestedTransactionInstructionidx = 0;
      if (TOKEN_PROGRAM_ID.equals(instructions[interestedTransactionInstructionidx].programId)) {
        const decoded = decodeTokenInstruction(instructions[interestedTransactionInstructionidx]);
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
        if (["burn", "burnChecked"].includes(decoded.type)) {
          const tokenState = tokenMap.find((x) => new PublicKey(x.mintAddress).equals(decoded.data.mint as PublicKey));
          const logoURI = infoState.metaplexMetaMap[tokenState?.mintAddress || ""]?.offChainMetaData?.image;

          let symbol = infoState.metaplexMetaMap[tokenState?.mintAddress || ""]?.symbol;
          if (!symbol) symbol = addressSlicer(tokenState?.mintAddress || "");
          return {
            tokenName: symbol,
            amount: tokenState?.balance?.uiAmount || 0,
            decimals: tokenState?.balance?.decimals as number,
            from: new PublicKey(decoded.data.owner || "").toBase58(),
            to: new PublicKey(BURN_ADDRESS_INC).toBase58(),
            mintAddress: tokenState?.mintAddress || "",
            logoURI: logoURI || "",
            conversionRate: {},
          };
        }
      }
    }
    return undefined;
  } catch (err) {
    log.error(err);
    // didn't throw error
    return undefined;
  }
};

// export const toObject = (objectwithBigInt: { [key: string]: any }): any => {
//   return JSON.parse(
//     JSON.stringify(
//       objectwithBigInt,
//       (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
//     )
//   );
// };
