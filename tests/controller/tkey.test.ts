import eccrypto, { decrypt as ecDecrypt, encrypt as ecEncrypt } from "@toruslabs/eccrypto";
import assert from "assert";
import BN from "bn.js";
import { ec as EC } from "elliptic";
import nock from "nock";
import sinon from "sinon";

import { getPubKeyECC, toPrivKeyECC } from "@/utils/tkey/base";
import TorusStorageLayer from "@/utils/tkey/storageLayer";
import * as tkey from "@/utils/tkey/utils";

import { openloginFaker } from "./mockData";
import nockRequest from "./nockRequest";

const ec = new EC("secp256k1");

describe("tkey utils", () => {
  const sandbox = sinon.createSandbox();
  const keyPair = ec.genKeyPair({ entropy: "ad1238470128347018934701983470183478sfa" });
  const pubKey = getPubKeyECC(keyPair.getPrivate());
  const privKey = toPrivKeyECC(keyPair.getPrivate());
  const msg = Buffer.from(JSON.stringify(openloginFaker[0]), "utf-8");
  const storageLayer = new TorusStorageLayer({ hostUrl: "https://solana-openlogin-state.tor.us" });
  const ecc_privateKey = eccrypto.generatePrivate();
  //   const ecc_publicKey = eccrypto.getPublic(ecc_privateKey);
  beforeEach(async () => {
    nockRequest();
  });
  afterEach(() => {
    nock.cleanAll();
  });
  it("encrypt", async () => {
    const result = await tkey.encrypt(pubKey, msg);
    const encryptedDetails = await ecEncrypt(pubKey, msg);
    assert(result.ciphertext, encryptedDetails.ciphertext.toString("hex"));
  });
  it("decrypt", async () => {
    const encryptMsg = await tkey.encrypt(pubKey, msg);
    const bufferEncDetails = {
      ciphertext: Buffer.from(encryptMsg.ciphertext, "hex"),
      ephemPublicKey: Buffer.from(encryptMsg.ephemPublicKey, "hex"),
      iv: Buffer.from(encryptMsg.iv, "hex"),
      mac: Buffer.from(encryptMsg.mac, "hex"),
    };
    const decryptDetails = await ecDecrypt(privKey, bufferEncDetails);
    const result = await tkey.decrypt(privKey, encryptMsg);
    assert.deepEqual(result, decryptDetails);
  });
  it("setMetadata", async () => {
    const result = await storageLayer.setMetadata({
      input: openloginFaker[0],
      privKey: new BN(ecc_privateKey),
    });
    assert.deepEqual(result, { message: "", success: true });
  });
  it("getMetadata", async () => {
    sandbox.stub(tkey, "decrypt").callsFake(async () => {
      return Buffer.from(JSON.stringify(openloginFaker[0]));
    });
    const result: any = await storageLayer.getMetadata({ privKey: new BN(ecc_privateKey, "hex") });
    assert.equal(result.privKey, openloginFaker[0].privKey);
  });
});
