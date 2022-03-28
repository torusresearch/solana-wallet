import eccrypto from "@toruslabs/eccrypto";
import { Data, post } from "@toruslabs/http-helpers";
import { keccak256 } from "@toruslabs/openlogin-utils";

interface MetaStorageArgs {
  enableLogging: boolean;
  hostUrl?: string;
  serverTimeOffset: number;
  storageName: string;
}

export class MetaStorage {
  enableLogging: boolean;

  hostUrl: string;

  storageName: string;

  serverTimeOffset: number;

  constructor({ storageName, enableLogging = false, hostUrl = "http://localhost:5051", serverTimeOffset = 0 }: MetaStorageArgs) {
    this.enableLogging = enableLogging;
    this.hostUrl = hostUrl;
    this.storageName = storageName;
    this.serverTimeOffset = serverTimeOffset;
    // localstorage ?
    // assocDapp
    // metadata
    // this.storageLayerName;
  }

  setStrageName(storageName: string) {
    this.storageName = storageName;
    return storageName;
  }

  async setMetadata<T>(params: { input: T; privKey?: Buffer }): Promise<{ message: string }> {
    const ecc_privateKey = params.privKey || eccrypto.generatePrivate();
    const ecc_publicKey = eccrypto.getPublic(ecc_privateKey);
    const encryptedState = await eccrypto.encrypt(ecc_publicKey, Buffer.from(JSON.stringify(params.input)));

    const setData = {
      data: encryptedState,
      timestamp: Date.now(),
    };

    const strData = JSON.stringify(setData);
    const hash = keccak256(strData).slice(2);
    const sign = await eccrypto.sign(ecc_privateKey, Buffer.from(hash, "hex"));

    return this.writeData({ pub_key: ecc_publicKey.toString("hex"), set_data: setData, signature: sign.toString("hex") });
  }

  async getMetadata(privKey: Buffer) {
    const ecc_privateKey = privKey;
    const ecc_publicKey = eccrypto.getPublic(ecc_privateKey);
    const { state } = await this.readData(ecc_publicKey.toString("hex"));

    const data = {
      ciphertext: Buffer.from(state.ciphertext),
      iv: Buffer.from(state.iv),
      mac: Buffer.from(state.mac),
      ephemPublicKey: Buffer.from(state.ephemPublicKey),
    } as eccrypto.Ecies;

    const decryptedStateArray = await eccrypto.decrypt(ecc_privateKey, data as eccrypto.Ecies);
    if (decryptedStateArray === null) throw new Error("Couldn't decrypt state from backend");
    const decryptedStateString = Buffer.from(decryptedStateArray).toString("utf-8");
    return JSON.parse(decryptedStateString);
  }

  private async writeData(params: Data) {
    // if (self.local)
    // localStorage.setItem("encryptedState", stringify(params));
    // return { message: "sucess" };
    return post<{ message: string }>(`${this.hostUrl}/set`, params);
  }

  private async readData(pubKey: string) {
    // if (self.local)
    // localStorage.getItem("encryptedState");
    const res = await post(`${this.hostUrl}/get`, { pub_key: pubKey });
    return res as { state: eccrypto.Ecies };
  }
}
