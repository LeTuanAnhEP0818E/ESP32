import axios, { AxiosError } from "axios";
import DeviceWallet from "../ethers/wallet";
import { TypedDataDomain } from "ethers";
import { splitSignature } from "../helpers";

import "../types/bigint";
import { handleAxiosError } from "./utils";

const mintTypes = {
    Mint: [
        { name: "iot", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
};

export interface IMinterClient {
    getWallet(): DeviceWallet;
    postMintSign(nonce: BigInt, amount: BigInt): Promise<void>;
    // getSeparator(): Promise<TypedDataDomain>;
}

export class DCarbonMinterClient implements IMinterClient {
    private _baseUrl: string;
    private _wallet: DeviceWallet;
    private _domain?: TypedDataDomain;

    constructor(baseUrl: string, wallet: DeviceWallet) {
        this._baseUrl = baseUrl;
        this._wallet = wallet;
        this._domain = undefined;
    }

    public getWallet(): DeviceWallet {
        return this._wallet;
    }

    public getLatest() {}

    public postMintSign(nonce: BigInt, amount: BigInt): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this._domain) {
                    this._domain = await this.getSeparator();
                }

                var amountHex = amount.toString(16);
                if (amountHex.length % 2 == 0) {
                    amountHex = "0x" + amountHex;
                } else {
                    amountHex = "0x0" + amountHex;
                }

                const data = {
                    iot: this._wallet.address,
                    amount: amountHex,
                    nonce: Number(nonce),
                };

                // produce signature and prepare minPayload
                const signature = await this._wallet.signTypedData(this._domain ?? {}, mintTypes, data);
                const rsv = splitSignature(signature);
                const mintPayload = { ...data, ...rsv };

                // Sending the signed payload
                await axios.post(`${this._baseUrl}/iots/${this._wallet.address}/mint-sign`, mintPayload);
                resolve();
            } catch (error) {
                reject(handleAxiosError(error));
            }
        });
    }

    public getSeparator(): Promise<TypedDataDomain> {
        return new Promise<TypedDataDomain>(async (resolve, reject) => {
            try {
                const response = await axios.get(`${this._baseUrl}/iots/separator`);
                const domain: TypedDataDomain = {
                    name: response.data.name,
                    version: response.data.version,
                    chainId: response.data.chainid,
                    verifyingContract: response.data.verifyingcontract,
                };
                resolve(domain);
            } catch (error) {
                reject(handleAxiosError(error));
            }
        });
    }
}
