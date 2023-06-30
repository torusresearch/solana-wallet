import { post } from "@toruslabs/http-helpers";
import { keccak256 } from "@toruslabs/metadata-helpers";
import BN from "bn.js";
import stringify from "json-stable-stringify";

import { getPubKeyECC, getPubKeyPoint, toPrivKeyEC, toPrivKeyECC } from "./base";
import { EncryptedMessage, StringifiedType, TorusStorageLayerAPIParams } from "./baseTypes/commonTypes";
import { decrypt, encrypt, KEY_NOT_FOUND } from "./utils";

// function signDataWithPrivKey(data: { timestamp: number }, privKey: BN): string {
//   const sig = ecCurve.sign(stripHexPrefix(keccak256(stringify(data))), toPrivKeyECC(privKey), "utf-8");
//   return sig.toDER("hex");
// }

class TorusStorageLayer {
  enableLogging: boolean;

  hostUrl: string;

  storageLayerName: string;

  serverTimeOffset: number;

  constructor({ enableLogging = false, hostUrl = "http://localhost:5051", serverTimeOffset = 0, storageLayerName = "TorusStorageLayer" }) {
    this.enableLogging = enableLogging;
    this.hostUrl = hostUrl;
    this.storageLayerName = storageLayerName;
    this.serverTimeOffset = serverTimeOffset;
  }

  // toJSON(): StringifiedType {
  //   throw new Error("Method not implemented.");
  // }

  static async serializeMetadataParamsInput(el: unknown, privKey: BN): Promise<unknown> {
    // General case, encrypt message
    const bufferMetadata = Buffer.from(stringify(el));
    let encryptedDetails: EncryptedMessage;
    if (privKey) {
      encryptedDetails = await encrypt(getPubKeyECC(privKey), bufferMetadata);
    } else {
      throw new Error("Invalid params");
    }
    const serializedEncryptedDetails = Buffer.from(stringify(encryptedDetails)).toString("base64");
    return serializedEncryptedDetails;
  }

  static fromJSON(value: StringifiedType): TorusStorageLayer {
    const { enableLogging, hostUrl, storageLayerName, serverTimeOffset = 0 } = value;
    if (storageLayerName !== "TorusStorageLayer") throw Error("storageName not match");
    return new TorusStorageLayer({ enableLogging, hostUrl, serverTimeOffset });
  }

  /**
   *  Get metadata for a key
   * @param privKey - If not provided, it will use service provider's share for decryption
   */
  async getMetadata<T>(params: { privKey: BN }): Promise<T> {
    const { privKey } = params;
    const keyDetails = this.generateMetadataParams({}, privKey);
    const metadataResponse = await post<{ message: string }>(`${this.hostUrl}/get`, keyDetails);
    // returns empty object if object
    if (metadataResponse.message === "") {
      return Object.create({ message: KEY_NOT_FOUND }) as T;
    }
    const encryptedMessage = JSON.parse(atob(metadataResponse.message));

    let decrypted: Buffer;
    if (privKey) {
      decrypted = await decrypt(toPrivKeyECC(privKey), encryptedMessage);
    } else {
      throw new Error("Invalid Params");
    }

    return JSON.parse(decrypted.toString()) as T;
  }

  /**
   * Set Metadata for a key
   * @param input - data to post
   * @param privKey - If not provided, it will use service provider's share for encryption
   */
  async setMetadata<T>(params: { input: T; privKey: BN }): Promise<{ message: string }> {
    const { privKey, input } = params;
    const metadataParams = this.generateMetadataParams(
      await TorusStorageLayer.serializeMetadataParamsInput(input, privKey),

      privKey
    );
    return post<{ message: string }>(`${this.hostUrl}/set`, metadataParams);
  }

  async setMetadataStream<T>(params: { input: Array<T>; privKey: Array<BN> }): Promise<{ message: string }> {
    const { privKey, input } = params;
    const newInput = input;
    const finalMetadataParams = await Promise.all(
      newInput.map(async (el, i) => this.generateMetadataParams(await TorusStorageLayer.serializeMetadataParamsInput(el, privKey[i]), privKey[i]))
    );

    const FD = new FormData();
    finalMetadataParams.forEach((el, index) => {
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
      timeout: 120000, // 2mins of timeout for excessive shares case
    };
    return post<{ message: string }>(`${this.hostUrl}/bulk_set_stream`, FD, options, customOptions);
  }

  generateMetadataParams(message: unknown, privKey: BN): TorusStorageLayerAPIParams {
    let sig: string;
    let pubX: string;
    let pubY: string;
    const namespace = this.storageLayerName;

    const setTKeyStore = {
      data: message,
      timestamp: new BN((this.serverTimeOffset + Date.now()) / 1000).toString(16),
    };

    const hash = keccak256(Buffer.from(stringify(setTKeyStore), "utf-8")).slice(2);
    if (privKey) {
      const unparsedSig = toPrivKeyEC(privKey).sign(hash);
      sig = Buffer.from(unparsedSig.r.toString(16, 64) + unparsedSig.s.toString(16, 64) + new BN(0).toString(16, 2), "hex").toString("base64");
      const pubK = getPubKeyPoint(privKey);
      pubX = pubK.x.toString("hex");
      pubY = pubK.y.toString("hex");
    } else throw new Error(" Invalid Params");
    return {
      pub_key_X: pubX,
      pub_key_Y: pubY,
      set_data: setTKeyStore,
      signature: sig,
      namespace,
    };
  }

  toJSON(): StringifiedType {
    return {
      enableLogging: this.enableLogging,
      hostUrl: this.hostUrl,
      storageLayerName: this.storageLayerName,
    };
  }
}

export default TorusStorageLayer;
