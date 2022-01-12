import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");

const secp256 = [
  ec.genKeyPair({ entropy: "ad1238470128347018934701983470183478sfa" }),
  ec.genKeyPair({ entropy: "ad1238470adsfio7018934701983470183478sfa" }),
  ec.genKeyPair({ entropy: "ad123847012834asdf934701983470183478sfa" }),
  ec.genKeyPair({ entropy: "ad123847012834701893470ffghj470183478sfa" }),
];
export const openloginFaker = [
  {
    privKey: secp256[0].getPrivate().toString("hex"),
    userInfo: { email: "", name: "", profileImage: "", aggregateVerifier: "", verifier: "", verifierId: "", typeOfLogin: "" },
  },
  {
    privKey: secp256[1].getPrivate().toString("hex"),
    userInfo: { email: "", name: "", profileImage: "", aggregateVerifier: "", verifier: "", verifierId: "", typeOfLogin: "" },
  },
  {
    privKey: secp256[2].getPrivate().toString("hex"),
    userInfo: { email: "", name: "", profileImage: "", aggregateVerifier: "", verifier: "", verifierId: "", typeOfLogin: "" },
  },
];
export const mockData = {
  backend: {
    currency: {
      USD: 140.15,
    },
    message: {
      success: true,
      message: "Solana Signin - 207561419917386",
    },
    verify: {
      public_address: "public address",
      signed_message:
        "e39fefbc4dc11899e26de146d194267c75ec160ec53a2b62fbc70cba0d2d62591facf1e15f67549b106af485c5cb450289829d78a6c637fd97a0f75f25b7920e",
    },
    recordLogin: {
      success: true,
      response: [2635],
    },
    user: {
      public_address: "public address",
      created_at: "2021-11-18T04:31:47.000Z",
      updated_at: "2022-01-11T08:01:59.000Z",
      verifier: "torus",
      verifier_id: "testing@tor.us",
      theme: "dark",
      locale: "en",
      enable_crash_reporter: 1,
      default_currency: "SOL",
      transactions: [
        {
          id: 2,
          created_at: "2021-11-18T04:41:53.000Z",
          updated_at: "2021-11-23T04:56:56.000Z",
          from: "",
          to: "",
          crypto_amount: "300000000",
          crypto_currency: "SOL",
          decimal: 9,
          currency_amount: "64.812",
          selected_currency: "USD",
          status: "finalized",
          network: "0x3",
          signature: "44b9JgGvDwkbRNLtupAzA918tpPfvGU4rTRN9o8AmAJD1R7VhktKkfQMRMNDMD6VkH8a5B",
          transaction_category: "transfer",
          is_cancel: 0,
          fee: "n/a",
          gasless: 0,
          gasless_relayer_public_key: "",
          mint_address: "",
        },
      ],

      contacts: [
        {
          id: 46,
          created_at: "2021-12-28T06:51:41.000Z",
          updated_at: "2021-12-28T06:51:41.000Z",
          contact_verifier: "solana",
          contact_verifier_id: "4wverifyier",
          display_name: "test",
          public_address: "public address",
        },
      ],
    },
  },
  coingekco: {
    "usd-coin": {
      usd: 1,
      aud: 1.39,
      cad: 1.26,
      eur: 0.883834,
      gbp: 0.737081,
      hkd: 7.8,
      idr: 14306.2,
      inr: 74.13,
      jpy: 115.78,
      php: 51.4,
      rub: 75.09,
      sgd: 1.36,
      uah: 27.41,
    },
  },
  openLoginHandler: openloginFaker[0],
};
