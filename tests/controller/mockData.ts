import { Keypair } from "@solana/web3.js";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import base58 from "bs58";
import { ec as EC } from "elliptic";

export const OffChainMetaplexUri = "https://metaplex.data";

const ec = new EC("secp256k1");

const secp256 = [
  ec.genKeyPair({ entropy: "ad1238470128347018934701983470183478sfa" }),
  ec.genKeyPair({ entropy: "ad1238470adsfio7018934701983470183478sfa" }),
  ec.genKeyPair({ entropy: "ad123847012834asdf934701983470183478sfa" }),
  ec.genKeyPair({ entropy: "ad123847012834701893470ffghj470183478sfa" }),
];

const genkeypair = (privatekey: string) => {
  return Keypair.fromSecretKey(getED25519Key(privatekey.padStart(64, "0")).sk);
};

export const sKeyPair = [
  genkeypair(secp256[0].getPrivate("hex")),
  genkeypair(secp256[1].getPrivate("hex")),
  genkeypair(secp256[2].getPrivate("hex")),
  genkeypair(secp256[3].getPrivate("hex")),
];

export const openloginFaker = [
  {
    solanaPrivKey: "",
    privKey: secp256[0].getPrivate().toString("hex"),
    userInfo: {
      email: "testing@tor.us",
      name: "testing",
      profileImage: "",
      aggregateVerifier: "torus",
      verifier: "torus",
      verifierId: "testing@tor.us",
      typeOfLogin: "google",
    },
    accounts: [
      {
        address: sKeyPair[0].publicKey.toBase58(),
        app: "Google testing@tor.us",
        name: "Solana Wallet http://localhost:8080",
        privKey: secp256[0].getPrivate().toString("hex"),
        solanaPrivKey: base58.encode(sKeyPair[0].secretKey),
      },
    ],
  },
  {
    solanaPrivKey: "",
    privKey: secp256[1].getPrivate().toString("hex"),
    userInfo: {
      email: "testing11@tor.us",
      name: "testing11",
      profileImage: "",
      aggregateVerifier: "torus",
      verifier: "torus",
      verifierId: "testing22@tor.us",
      typeOfLogin: "google",
    },
    accounts: [],
  },
  {
    solanaPrivKey: "",
    privKey: secp256[2].getPrivate().toString("hex"),
    userInfo: {
      email: "testing22@tor.us",
      name: "testing22",
      profileImage: "",
      aggregateVerifier: "torus",
      verifier: "torus",
      verifierId: "testing22@tor.us",
      typeOfLogin: "google",
    },
    accounts: [],
  },
];

// verify: {
//   public_address: sKeyPair[0].publicKey.toBase58(),
//   signed_message:
//     "e39fefbc4dc11899e26de146d194267c75ec160ec53a2b62fbc70cba0d2d62591facf1e15f67549b106af485c5cb450289829d78a6c637fd97a0f75f25b7920e",
// },
export const postTransaction = [
  {
    success: true,
    response: [354],
  },
  {
    success: true,
    response: [355],
  },
  {
    success: true,
    response: [356],
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
      success: true,
      token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdWJsaWNfYWRkcmVzcyI6IngxUVRkVk1jZm5USlBFV2pLTERSbjUyNTI3UWkyaXRjTFhVMnFwZ2FVVkwiLCJpYXQiOjE2NDIwNDI2NzAsImV4cCI6MTY0MjA4NTg3MH0.SWc31gRrQjmsdvRIdtBxgwowwFemmIJPQvqXtCTGTDJ2m3YwiF4cfxdNuvEVsSWYpx15j_IQjIvmi1fPljFPvw",
    },
    recordLogin: {
      success: true,
      response: [2635],
    },
    user: {
      data: {
        public_address: sKeyPair[0].publicKey.toBase58(),
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
            from: sKeyPair[0].publicKey.toBase58(),
            to: sKeyPair[0].publicKey.toBase58(),
            crypto_amount: "300000000",
            crypto_currency: "SOL",
            decimal: 9,
            currency_amount: "64.812",
            selected_currency: "USD",
            status: "finalized",
            network: "0x1",
            signature: "44b9JgGvDwkbRNLtupAzA918tpPfvGU4rTRN9o8AmAJD1R7VhktKkfQMRMNDMD6VkH8a5B",
            transaction_category: "transfer",
            is_cancel: 0,
            fee: "n/a",
            gasless: 0,
            gasless_relayer_public_key: "",
            mint_address: "",
          },
        ],
        displayActivities: {
          EKRG4kVcmKmrzFmq4bpbRqbiQGiXFoYUryLyrVx4JKYSgzuCS3N7fnNMenuVnSV1Ent2rqnJtPWH5c98GBeiGjp: {
            action: "walletActivity.unknown",
            status: "submitted",
            id: 1847,
            from: "B4KFwF132WveLVTdvt9iprzxPHcFux2t6tgNMbR2Vmr8",
            to: "unknown-unknown-unknown-unknown-",
            rawDate: "2022-05-26T19:59:39.000Z",
            updatedAt: 1653595179000,
            blockExplorerUrl:
              "https://explorer.solana.com/tx/EKRG4kVcmKmrzFmq4bpbRqbiQGiXFoYUryLyrVx4JKYSgzuCS3N7fnNMenuVnSV1Ent2rqnJtPWH5c98GBeiGjp/?cluster=mainnet",
            network: "mainnet",
            chainId: "0x1",
            signature: "EKRG4kVcmKmrzFmq4bpbRqbiQGiXFoYUryLyrVx4JKYSgzuCS3N7fnNMenuVnSV1Ent2rqnJtPWH5c98GBeiGjp",
            fee: null,
            type: "unknown",
            decimal: 9,
            logoURI: "",
            mintAddress: "",
          },
          "3iQgERPHrcn3rqZK9LUtUf9eM3ancT3tFZHP5ZSNS6G1T1YN4b7NhNPN2u4m721QHEWRGoT15FLybfTFgz2p1Q3D": {
            slot: "140530275",
            status: "finalized",
            updatedAt: 1657162954000,
            signature: "3iQgERPHrcn3rqZK9LUtUf9eM3ancT3tFZHP5ZSNS6G1T1YN4b7NhNPN2u4m721QHEWRGoT15FLybfTFgz2p1Q3D",
            txReceipt: "3iQgERPHrcn3rqZK9LUtUf9eM3ancT3tFZHP5ZSNS6G1T1YN4b7NhNPN2u4m721QHEWRGoT15FLybfTFgz2p1Q3D",
            blockExplorerUrl:
              "https://explorer.solana.com/tx/3iQgERPHrcn3rqZK9LUtUf9eM3ancT3tFZHP5ZSNS6G1T1YN4b7NhNPN2u4m721QHEWRGoT15FLybfTFgz2p1Q3D/?cluster=mainnet",
            chainId: "0x1",
            network: "mainnet",
            rawDate: "2022-07-07T03:02:34.000Z",
            action: "walletActivity.send",
            type: "transferChecked",
            decimal: 0,
            from: "B4KFwF132WveLVTdvt9iprzxPHcFux2t6tgNMbR2Vmr8",
            to: "CdkkYiLZs5iet9VDEcevuM4T8WhCUuL7Vy7dPUmL9WQg",
            cryptoAmount: "1",
            cryptoCurrency: "-",
            fee: 5000,
            send: true,
            totalAmountString: "1.0000",
            logoURI: "",
            mintAddress: "ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK",
          },
        },
        contacts: [
          {
            id: 46,
            created_at: "2021-12-28T06:51:41.000Z",
            updated_at: "2021-12-28T06:51:41.000Z",
            contact_verifier: "solana",
            contact_verifier_id: "4wverifyier",
            display_name: "test",
            public_address: sKeyPair[0].publicKey.toBase58(),
          },
        ],
      },
      success: true,
    },
    transaction: postTransaction[0],
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
export const testNetTokenWWW = {
  chainId: null,
  address: "E4nC2ThDznHgwdFEPyze8p9U28ueRuomx8o3MTgNM7yz",
  symbol: "WWW",
  name: "WWW",
  decimals: 9,
  network: "Solana Testnet",
  publicAddress: "B4KFwF132WveLVTdvt9iprzxPHcFux2t6tgNMbR2Vmr8",
  logoURI: "",
};
const testNetTokenS = {
  chainId: null,
  address: "5RA64XFTwfAaZLqNvJoFsNMcCQRdEd4kzGTd9c276VjK",
  symbol: "SSS",
  name: "s",
  decimals: 9,
  network: "Solana Testnet",
  publicAddress: "B4KFwF132WveLVTdvt9iprzxPHcFux2t6tgNMbR2Vmr8",
  logoURI: "",
};
export const mockTokens = {
  tokens: {
    "7dpVde1yJCzpz2bKNiXWh7sBJk7PFvv576HnyFCrgNyW": {
      E4nC2ThDznHgwdFEPyze8p9U28ueRuomx8o3MTgNM7yz: testNetTokenWWW,
      "5RA64XFTwfAaZLqNvJoFsNMcCQRdEd4kzGTd9c276VjK": testNetTokenS,
    },
    FKUPMMJM89UEuq2zGiTYHp69oD13s8ioqjYTuys2MgKP: [],
  },
};

export const mockBillBoardEvent = {
  eventName: "w3auth",
  imageUrl: "https://www.web3auth.io/images/web3auth-logo.svg",
  imageDarkUrl: "https://www.web3auth.io/images/web3auth-logo-Dark.svg",
  description: "w3auth",
  callToActionLinkTwo: "https://www.web3auth.io/",
  callToActionLink: "https://www.web3auth.io/",
  callToActionText: "click here",
  locale: "en",
};
export const mockDapps = [
  {
    category: "Marketplace",
    logo: [
      {
        id: "att6434quBCmlsg0b",
        url: "https://dl.airtable.com/.attachments/549760d07f4d6c5bf0f296fbb5c94e7d/c5ece7df/favicon5.ico?ts=1658426084&userId=usru62oc2KDUhq9ds&cs=c9ac2f560807d3d8",
        filename: "favicon (5).ico",
        size: 12014,
        type: "image/vnd.microsoft.icon",
      },
    ],
    network: "mainnet",
    title: "Hyperspace",
    desc: "NFT Market place",
    url: "https://hyperspace.xyz/",
    torus_domain: ["solana", "solana-testing", "solana-develop"],
  },
  {
    category: "DeFi",
    logo: [
      {
        id: "attWIP3czFbo3bFeq",
        width: 50,
        height: 50,
        url: "https://dl.airtable.com/.attachments/3a3fa6010ad8f986af5848a02876a201/919f8590/PSigc4ie_400x400.jpg?ts=1658426084&userId=usru62oc2KDUhq9ds&cs=21414b284bf3bae5",
        filename: "PSigc4ie_400x400.jpg",
        size: 1007,
        type: "image/jpeg",
        thumbnails: {
          small: {
            url: "https://dl.airtable.com/.attachmentThumbnails/ef8312a7b53ba857ba1448972361ed87/57b75fe0?ts=1658426084&userId=usru62oc2KDUhq9ds&cs=24963ffa441e2d5e",
            width: 36,
            height: 36,
          },
          large: {
            url: "https://dl.airtable.com/.attachmentThumbnails/931d9f09d58e184fd2a263f8939d5800/5e779491?ts=1658426084&userId=usru62oc2KDUhq9ds&cs=5f93e0447fb51326",
            width: 50,
            height: 50,
          },
          full: {
            url: "https://dl.airtable.com/.attachmentThumbnails/ab4ec2f65b68b4d2a4cae4f507fc3e62/86438149?ts=1658426084&userId=usru62oc2KDUhq9ds&cs=e05d60576814b071",
            width: 3000,
            height: 3000,
          },
        },
      },
    ],
    network: "mainnet",
    title: "Raydium",
    desc: "An avenue for the evolution of DeFi",
    url: "https://raydium.io/swap",
    torus_domain: ["solana", "solana-testing", "solana-develop"],
  },
];

export const mockNFTs = [
  {
    mintAddress: "fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim",
    tokenAddress: "2cZp4t78c7XT95ti6dU2AgHVZFwzJgb9itdZzd9fqyNB",
    balance: { amount: "1", decimals: 0, uiAmount: 1, uiAmountString: "1" },
    isFungible: false,
    metaplexData: {
      name: "Fuel",
      uri: "https://storage.googleapis.com/nft-assets/items/FUEL.png",
      symbol: "Fuel",
      offChainMetaData: {
        symbol: "Fuel",
        name: "Fuel",
        description: "Basic hydrogen fuel cell replenishment. Low energy density, can be improved with further refinement.",
        image: "https://storage.googleapis.com/nft-assets/items/FUEL.png",
        collection: { name: "Fuel", family: "M1NTq6mJnYhyhRe1ZRum1v54AqHmvo4mYYGk7tcFcHn" },
      },
    },
    name: "Fuel",
    iconURL: "https://storage.googleapis.com/nft-assets/items/FUEL.png",
    symbol: "Fuel",
  },
  {
    mintAddress: "ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK",
    tokenAddress: "FaTaNB1xxoj4TPA62twPr4mZ6i8yuEQE6nEypsKAiS4B",
    balance: { amount: "2", decimals: 0, uiAmount: 2, uiAmountString: "2" },
    isFungible: false,
    metaplexData: {
      name: "Ammunition",
      symbol: "AMMO",
      uri: "https://galaxy.staratlas.com/nfts/ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000",
      sellerFeeBasisPoints: 0,
      creators: null,
      offChainMetaData: {
        _id: "61b3f1a341ea72257bf56a22",
        description:
          "The most basic form of space-grade ballistic ammunition. Compatible with kinetic type slotted weaponry. Weak against energy shielding, effective against hull plating.",
        image: "https://storage.googleapis.com/nft-assets/items/AMMO.png",
        symbol: "AMMO",
        name: "Ammunition",
        collection: { name: "Ammunition", family: "Star Atlas" },
        slots: { crewSlots: null, componentSlots: null, moduleSlots: null },
        media: { qrInstagram: "", qrFacebook: "", sketchfab: "", audio: "", thumbnailUrl: "", gallery: null },
        tradeSettings: { msrp: { value: 0, currencySymbol: "USDC" } },
        deactivated: false,
        markets: [
          {
            _id: "61bad156d3d4980038939be2",
            id: "8qtV9oq8VcrUHZdEeCJ2bUM3uLwjrfJ9U9FGrCSvu34z",
            quotePair: "ATLAS",
            serumProgramId: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
          },
        ],
        primarySales: [],
        airdrops: [],
        createdAt: "2021-04-20T18:17:07.517Z",
        updatedAt: "2022-02-01T05:22:05.426Z",
        mint: "ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK",
      },
    },
    name: "Ammunition",
    iconURL: "https://storage.googleapis.com/nft-assets/items/AMMO.png",
    symbol: "AMMO",
  },
];

export const mockClubbedNFTs = [
  {
    title: "Fuel",
    count: 1,
    description: "Basic hydrogen fuel cell replenishment. Low energy density, can be improved with further refinement.",
    img: "https://storage.googleapis.com/nft-assets/items/FUEL.png",
    mints: ["fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim"],
    collectionName: "M1NTq6mJnYhyhRe1ZRum1v54AqHmvo4mYYGk7tcFcHn",
  },
  {
    title: "Ammunition",
    count: 1,
    description:
      "The most basic form of space-grade ballistic ammunition. Compatible with kinetic type slotted weaponry. Weak against energy shielding, effective against hull plating.",
    img: "https://storage.googleapis.com/nft-assets/items/AMMO.png",
    mints: ["ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK"],
    collectionName: "Star Atlas",
  },
];
