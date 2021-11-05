import { AccountInfo, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo } from "@solana/spl-token-registry/dist/main/lib/tokenlist";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { awaitReq } from "@toruslabs/openlogin";
import { SolanaToken } from "@toruslabs/solana-controllers";
import base58 from "bs58";
import { computed, watch } from "vue";

import solicon from "@/assets/solana-mascot.svg";
import ControllerModule from "@/modules/controllers";
import ControllersModule from "@/modules/controllers";

const selectedAddress = ControllerModule.torusState.PreferencesControllerState.selectedAddress;
const publicKey = ControllerModule.torusState.KeyringControllerState.wallets.find((x) => x.address === selectedAddress)?.publicKey || "";
const solTokens = computed<SolanaToken[] | undefined>(() => ControllersModule.torusState.TokensTrackerState.tokens?.[publicKey]);
const key =
  ControllersModule.torusState.KeyringControllerState.wallets.find(
    (it) => it.address === ControllersModule.torusState.PreferencesControllerState.selectedAddress
  )?.privateKey ?? "Key not found";

const solanaToken = {
  name: "Solana",
  iconURL: solicon,
  symbol: "SOL",
};
export let tokens: any[] = [
  solanaToken,
  ...(solTokens?.value?.map((st) => {
    return { ...st, name: st.data.name, iconURL: st.data.logoURI, symbol: st.data?.symbol };
  }) || []),
];

watch(solTokens, () => {
  // react to solTokens changes
  tokens = [
    solanaToken,
    ...(solTokens?.value?.map((st) => {
      return { ...st, name: st.data.name, iconURL: st.data.logoURI, symbol: st.data?.symbol };
    }) || []),
  ];
});
// pub_add
// as_tok_ad
export async function transfer(to: string, amount: number, tokenMintAddress: string) {
  const connection = new Connection(ControllerModule.torusState.NetworkControllerState.providerConfig.rpcTarget);
  const senderAccount = Keypair.fromSecretKey(base58.decode(key));

  const mintPublicKey = new PublicKey(tokenMintAddress);
  const mintToken = new Token(
    connection,
    mintPublicKey,
    TOKEN_PROGRAM_ID,
    senderAccount // the senderAccount owner will pay to transfer and to create recipients associated token account if it does not yet exist.
  );
  let toTokenAccount: any = null;
  const receiverAccountInfo = await connection.getAccountInfo(new PublicKey(to));
  if (receiverAccountInfo?.owner?.toString() === TOKEN_PROGRAM_ID.toString()) {
    // address is a assoc token address
    toTokenAccount = { address: new PublicKey(to) };
  } else {
    // address is a wallet pub key
    toTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(new PublicKey(to));
  }
  const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(senderAccount.publicKey);
  const transaction = new Transaction().add(
    Token.createTransferInstruction(TOKEN_PROGRAM_ID, fromTokenAccount.address, toTokenAccount.address, senderAccount.publicKey, [], amount)
  );

  const transactionSignature = await connection.sendTransaction(transaction, [senderAccount]);

  await connection.confirmTransaction(transactionSignature, "confirmed");
}

export function getTokenData(mintAddress: string): TokenInfo | undefined {
  const tokenList = JSON.parse(localStorage.getItem("SPL_TOKEN_LIST") + "")?.data;
  return tokenList.find((token: any) => token.address === mintAddress) || undefined;
}
