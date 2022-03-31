import eccrypto from "@toruslabs/eccrypto";
import { Data, post } from "@toruslabs/http-helpers";
import { keccak256 } from "@toruslabs/openlogin-utils";
import stringify from "safe-stable-stringify";

interface MetaStorageArgs {
  storageName: string;
  hostUrl?: string;
  enableLogging?: boolean;
  serverTimeOffset?: number;
  privateKey?: Buffer;
}

type SetDataType = {
  data: Data;
  nonce?: number;
  timestamp: number;
};
export interface MetaStorageData {
  pub_key: string;
  set_data: SetDataType;
  signature: string;
  namespace?: string;
}

const metaDataSecp256k1Sign = async (eccPrivateKey: Buffer, data: Data, namespace?: string) => {
  const eccPublicKey = eccrypto.getPublic(eccPrivateKey);
  const encryptedState = await eccrypto.encrypt(eccPublicKey, Buffer.from(JSON.stringify(data)));

  const setData = {
    data: encryptedState,
    timestamp: Date.now(),
  };

  const strData = JSON.stringify(setData);
  const hash = keccak256(strData).slice(2);
  const sign = await eccrypto.sign(eccPrivateKey, Buffer.from(hash, "hex"));
  return { pub_key: eccPublicKey.toString("hex"), set_data: setData, signature: sign.toString("hex"), namespace };
};

export class MetaStorage {
  enableLogging: boolean;

  hostUrl: string;

  storageName: string;

  serverTimeOffset: number;

  generatedPrivateKey: Buffer;

  constructor({ storageName, privateKey, enableLogging = false, hostUrl = "http://localhost:4022", serverTimeOffset = 0 }: MetaStorageArgs) {
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

  async setBulkMetadata<T>(params: { input: T[]; privKey: Buffer[] }): Promise<{ message: string }> {
    const bulkDataPromise = params.input.map(async (item, index): Promise<MetaStorageData> => {
      const eccPrivateKey = params.privKey[index] || this.generatedPrivateKey;
      const eccPublicKey = eccrypto.getPublic(eccPrivateKey);

      const encryptedState = await eccrypto.encrypt(eccPublicKey, Buffer.from(stringify(item)));

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

  async acquireWriteLock(params: { privKey: Buffer }): Promise<{ status: number; id?: string }> {
    const { privKey } = params;
    const data = {
      timestamp: Math.floor((this.serverTimeOffset + Date.now()) / 1000),
    };

    const metadataParams = await metaDataSecp256k1Sign(privKey, data);
    const lockParams = {
      key: metadataParams.pub_key,
      data: metadataParams.set_data,
      signature: metadataParams.signature,
    };
    return post<{ status: number; id?: string }>(`${this.hostUrl}/acquireLock`, lockParams);
  }

  async releaseWriteLock(params: { id: string; privKey: Buffer }): Promise<{ status: number }> {
    const { privKey, id } = params;
    const data = {
      timestamp: Math.floor((this.serverTimeOffset + Date.now()) / 1000),
    };

    const metadataParams = await metaDataSecp256k1Sign(privKey, data);
    const lockParams = {
      key: metadataParams.pub_key,
      data: metadataParams.set_data,
      signature: metadataParams.signature,
      id,
    };
    return post<{ status: number; id?: string }>(`${this.hostUrl}/releaseLock`, lockParams);
  }

  private async writeBulkData(params: MetaStorageData[]) {
    // if (self.local)
    // localStorage.setItem("encryptedState", stringify(params));
    // return { message: "sucess" };
    const FD = new FormData();
    params.forEach((el, index) => {
      FD.append(index.toString(), JSON.stringify(el));
    });

    const options: RequestInit = {
      mode: "cors",
      method: "POST",
      // headers: {
      //   "Content-Type": undefined,
      // },
    };

    const customOptions = {
      isUrlEncodedData: true,
    };
    return post<{ message: string }>(`${this.hostUrl}/bulk_set_stream`, FD, options, customOptions);
  }

  private async writeData(params: MetaStorageData) {
    // if (self.local)
    // localStorage.setItem("encryptedState", stringify(params));
    // return { message: "sucess" };
    return post<{ message: string }>(`${this.hostUrl}/set`, params);
  }

  private async readData(pubKey: string, namespace?: string) {
    // if (self.local)
    // localStorage.getItem("encryptedState");
    const res = await post(`${this.hostUrl}/get`, { pub_key: pubKey, namespace: namespace || this.storageName });
    return res as { state: eccrypto.Ecies };
  }
}
