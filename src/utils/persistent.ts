import { writeFileSync, readFileSync, appendFileSync, mkdirSync, existsSync } from "fs";
import { ethers, Wallet } from "ethers";
import { EtherSingleton } from "../ethers/wallet";

export interface IPersistent<T> {
    save(data: T): Promise<void>;
    loadLatest(): Promise<T | null>;
}

export interface PersistentConfig {
    path: string;
    wallet?: Wallet;
}

export function createPersistent<T>(config: PersistentConfig): IPersistent<T> {
    if (config.wallet) {
        return new PersistentWithSign<T>(config.path, config.wallet ?? EtherSingleton.getIotWallet());
    }
    throw new Error("Invalid config");
}

const latestFile = "latest.json";
const loggerFile = "logger.txt";

interface SignedData {
    ca: string;
    raw: string; // raw json
    sign: string; // Hex  string
}

export class PersistentWithSign<T> implements IPersistent<T> {
    private _wallet: Wallet;
    private _folder: string;
    private _loggerFile: string;
    private _latestFile: string;

    constructor(folder: string, wallet: Wallet) {
        if (!existsSync(folder)) {
            mkdirSync(folder, { recursive: true });
        }

        this._wallet = wallet;
        this._folder = folder;
        this._latestFile = `${this._folder}/${this._wallet.address}_${latestFile}`;
        this._loggerFile = `${this._folder}/${this._wallet.address}_${loggerFile}`;
    }

    save(data: T): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                var raw = JSON.stringify(data);
                var sign = await this._wallet.signMessage(raw);
                var ca = new Date();
                var jsonStr = JSON.stringify({ ca: ca.toJSON(), raw, sign });
                writeFileSync(this._latestFile, jsonStr, "utf-8");
                appendFileSync(this._loggerFile, jsonStr + " \n", "utf-8");
                resolve();
            } catch (error) {
                reject(error);
            }

            JSON.stringify({ x: 3, y: 4, z: 0 }, (k, v) => (v ? v : undefined));
        });
    }

    loadLatest(): Promise<T | null> {
        return new Promise<T | null>(async (resolve, reject) => {
            if (!existsSync(this._latestFile)) {
                resolve(null);
                return;
            }
            try {
                var buff = readFileSync(this._latestFile, "utf-8");
                buff = buff.trim();
                if (buff == "") {
                    resolve(null);
                } else {
                    var signed: SignedData = JSON.parse(buff);
                    var signer = ethers.verifyMessage(signed.raw, signed.sign);
                    if (signer != this._wallet.address) {
                        reject(new Error(`Persistent signed data is invalid`));
                    } else {
                        resolve(JSON.parse(signed.raw));
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}
