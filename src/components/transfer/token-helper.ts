import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
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
};
export let tokens: any[] = [
  solanaToken,
  ...(solTokens?.value?.map((st) => {
    return { ...st, name: st.data.name, iconURL: st.data.logoURI };
  }) || []),
];

watch(solTokens, () => {
  // react to solTokens changes
  tokens = [
    solanaToken,
    ...(solTokens?.value?.map((st) => {
      return { ...st, name: st.data.name, iconURL: st.data.logoURI };
    }) || []),
  ];
});

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
  const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(senderAccount.publicKey);
  const toTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(new PublicKey(to));
  const transaction = new Transaction().add(
    Token.createTransferInstruction(TOKEN_PROGRAM_ID, fromTokenAccount.address, toTokenAccount.address, senderAccount.publicKey, [], amount)
  );

  const transactionSignature = await connection.sendTransaction(transaction, [senderAccount]);

  await connection.confirmTransaction(transactionSignature, "confirmed");
}
