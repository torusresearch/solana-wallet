import eccrypto from "@toruslabs/eccrypto";
import { Data, post } from "@toruslabs/http-helpers";
import { keccak256 } from "@toruslabs/openlogin-utils";

interface MetaStorageArgs {
  enableLogging: boolean;
  hostUrl?: string;
  serverTimeOffset: number;
  storageName: string;
  privateKey?: Buffer;
}

type SetDataType = {
  data: Data;
  nonce?: number;
  timestamp: number;
};
interface MetaStorageData {
  pub_key: string;
  set_data: SetDataType;
  signature: string;
  namespace?: string;
}

export class MetaStorage {
  enableLogging: boolean;

  hostUrl: string;

  storageName: string;

  serverTimeOffset: number;

  generatedPrivateKey: Buffer;

  constructor({ storageName, privateKey, enableLogging = false, hostUrl = "http://localhost:5051", serverTimeOffset = 0 }: MetaStorageArgs) {
    this.enableLogging = enableLogging;
    this.hostUrl = hostUrl;
    this.storageName = storageName;
    this.serverTimeOffset = serverTimeOffset;

    this.generatedPrivateKey = privateKey || eccrypto.generatePrivate();

    // localstorage ?
    // assocDapp
    // metadata
  }

  setStorageName(storageName: string) {
    this.storageName = storageName;
    return storageName;
  }

  async setMetadata<T>(params: { input: T; privKey?: Buffer }): Promise<{ message: string }> {
    const eccPrivateKey = params.privKey || this.generatedPrivateKey;
    const eccPublicKey = eccrypto.getPublic(eccPrivateKey);
    const encryptedState = await eccrypto.encrypt(eccPublicKey, Buffer.from(JSON.stringify(params.input)));

    const setData = {
      data: encryptedState,
      timestamp: Date.now(),
    };

    const strData = JSON.stringify(setData);
    const hash = keccak256(strData).slice(2);
    const sign = await eccrypto.sign(eccPrivateKey, Buffer.from(hash, "hex"));

    return this.writeData({ pub_key: eccPublicKey.toString("hex"), set_data: setData, signature: sign.toString("hex"), namespace: this.storageName });
  }

  async getMetadata(privKey: Buffer) {
    const eccPrivateKey = privKey;
    const eccPublicKey = eccrypto.getPublic(eccPrivateKey);
    const { state } = await this.readData(eccPublicKey.toString("hex"));

    const data = {
      ciphertext: Buffer.from(state.ciphertext),
      iv: Buffer.from(state.iv),
      mac: Buffer.from(state.mac),
      ephemPublicKey: Buffer.from(state.ephemPublicKey),
    } as eccrypto.Ecies;

    const decryptedStateArray = await eccrypto.decrypt(eccPrivateKey, data as eccrypto.Ecies);
    if (decryptedStateArray === null) throw new Error("Couldn't decrypt state from backend");
    const decryptedStateString = Buffer.from(decryptedStateArray).toString("utf-8");
    return JSON.parse(decryptedStateString);
  }

  async setBulkMetadata<T>(params: { input: T[]; privKey?: Buffer }): Promise<{ message: string }> {
    const eccPrivateKey = params.privKey || this.generatedPrivateKey;
    const eccPublicKey = eccrypto.getPublic(eccPrivateKey);

    const bulkDataPromise = params.input.map(async (item): Promise<MetaStorageData> => {
      const encryptedState = await eccrypto.encrypt(eccPublicKey, Buffer.from(JSON.stringify(item)));

      const setData = {
        data: encryptedState,
        timestamp: Date.now(),
      };

      const strData = JSON.stringify(setData);
      const hash = keccak256(strData).slice(2);
      const sign = await eccrypto.sign(eccPrivateKey, Buffer.from(hash, "hex"));
      return { pub_key: eccPublicKey.toString("hex"), set_data: setData, signature: sign.toString("hex"), namespace: this.storageName };
    });
    const bulkData = await Promise.all(bulkDataPromise);
    return this.writeBulkData(bulkData);
  }

  private async writeBulkData(params: MetaStorageData[]) {
    // if (self.local)
    // localStorage.setItem("encryptedState", stringify(params));
    // return { message: "sucess" };
    return post<{ message: string }>(`${this.hostUrl}/bulk_set`, params);
    // option use bulk stream ?
  }

  private async writeData(params: MetaStorageData) {
    // if (self.local)
    // localStorage.setItem("encryptedState", stringify(params));
    // return { message: "sucess" };
    return post<{ message: string }>(`${this.hostUrl}/set`, params);
  }

  private async readData(pubKey: string) {
    // if (self.local)
    // localStorage.getItem("encryptedState");
    const res = await post(`${this.hostUrl}/get`, { pub_key: pubKey, namespace: this.storageName });
    return res as { state: eccrypto.Ecies };
  }
}
