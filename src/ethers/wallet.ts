import { ethers, JsonRpcProvider, Provider, randomBytes, SigningKey, Wallet } from "ethers";
import { existsSync, readFileSync, writeFileSync } from "fs";

export interface IVerifier {
    verifySign(message: string | Uint8Array, sign: string | Uint8Array): boolean;
}

export function getPKFromFile(path: string): string {
    if (existsSync(path)) {
        return readFileSync(path, "utf-8").trim();
    }

    var pk = randomPk();
    writeFileSync(path, pk, "utf-8");
    return pk;
}

export class EtherSingleton {
    private static _instance: Provider;
    private static _wallet: DeviceWallet;

    static getInstance(): Provider {
        return this._instance || new JsonRpcProvider(process.env.RPC_PROVIDER_URL || "http://localhost:8545");
    }

    static getIotWallet(): DeviceWallet {
        if (this._wallet) {
            return this._wallet;
        }
        console.error("Not yet init iot wallet");
        process.exit(1);
    }

    static getSensorWallet(pk: string): DeviceWallet {
        if (pk) {
            return new DeviceWallet(false, pk, EtherSingleton.getInstance());
        }
        return this.getIotWallet();
    }

    static createIotWallet(pk: string): DeviceWallet {
        this._wallet = new DeviceWallet(true, pk, EtherSingleton.getInstance());
        return this._wallet;
    }
}

export default class DeviceWallet extends Wallet {
    private _isIot = false;

    constructor(isIot: boolean, key: string | SigningKey, provider?: null | Provider) {
        super(key, provider);
        this._isIot = isIot;
    }

    isIot(): boolean {
        return this._isIot;
    }
}

function randomPk(): string {
    var buff = randomBytes(32);
    const privateKey = ethers.hexlify(buff);
    return privateKey;
}

// export function createSensorWallet(pk: string): DeviceWallet {
//     if (pk) {
//         return new DeviceWallet(false, pk, EtherSingleton.getInstance());
//     }
//     return EtherSingleton.getIotWallet();
// }
