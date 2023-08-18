import * as ethUtil from "ethereumjs-util";
import { ethers } from "ethers";
import { randomBytes } from "crypto";
import axios from "axios";
import { SMConfig } from "./env";

import fs from "fs";
import path from "path";

const PK_dir = path.join(__dirname, "private");
const PK_path = path.join(PK_dir, "ether.pk");

const configDir = path.join(__dirname, "config");
const contractPath = path.join(configDir, "ERC20Minter.json");

if (!fs.existsSync(PK_dir)) {
    fs.mkdirSync(PK_dir);
}

interface SeparatorType {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}

const defaultSeparator: SeparatorType = {
    name: SMConfig.name,
    version: SMConfig.version,
    chainId: SMConfig.chainId,
    verifyingContract: SMConfig.verifyingContract,
};

class Wallet {
    public nonce = 0n;
    public wallet: ethers.Wallet;
    public address: string;
    private _provider: ethers.JsonRpcProvider;

    constructor() {
        const privateKey = getPK();
        this._provider = new ethers.JsonRpcProvider(SMConfig.ProviderURL);
        this.wallet = new ethers.Wallet(privateKey, this._provider);
        this.address = this.wallet.address.toLowerCase(); // 32 bytes with '0x' prefix
        this.getNonce();
    }

    public signEIP712(
        domain: ethers.TypedDataDomain,
        types: Record<string, ethers.TypedDataField[]>,
        value: Record<string, any>
    ): Promise<string> {
        return this.wallet.signTypedData(domain, types, value);
    }

    public async getNonce(): Promise<bigint> {
        try {
            const contractData = fs.readFileSync(contractPath, "utf-8");
            const contractObj = JSON.parse(contractData);
            const contractABI = contractObj.abi;

            const contract = new ethers.Contract(SMConfig.verifyingContract, contractABI, this._provider);
            this.nonce = await contract.getNonce(this.address);
            return this.nonce;
        } catch (error) {
            console.error(`getNonce: ${error}`);
            return this.nonce;
        }

        // // Note: current Transaction Count is nonce for the nex Transaction.
        // // ... But becareful when someone count from 1 !
        // try {
        //     const txCount = await this.wallet.provider?.getTransactionCount(this.address);
        //     if (txCount) {
        //         this.nonce = txCount;
        //     }
        //     return this.nonce;
        // } catch (error) {
        //     console.error(`getNonce: ${error}`);
        //     return this.nonce;
        // }
    }

    public async getSeparator(baseURL: string): Promise<SeparatorType> {
        // TODO: think about a potential double counting when the server change the separator ?!
        try {
            const response = await axios.get(baseURL + "/iots/separator");
            const domain = {
                name: response.data.name,
                version: response.data.version,
                chainId: response.data.chainid,
                verifyingContract: response.data.verifyingcontract,
            };
            return domain;
        } catch (error) {
            console.error(`${error}`);
            return defaultSeparator;
        }
    }
}

/**
 * Read private key from PK_path. If that file doesn't exist:
 * - Print out error message
 * - Exit program with code 1.
 */
function getPK(): string {
    if (fs.existsSync(PK_path)) {
        const privateKey = fs.readFileSync(PK_path, "utf-8");
        return privateKey;
    } else {
        console.error(`Haven't found any PK for the wallet. Please initialize your project first by 'dCarbon-cli'`);
        process.exit(1);
        //  * - generate a new PK and Ether Address
        //  * - write PK and AD to the corresponding files
        // const pkBuffer = randomBytes(32);
        // const privateKey = pkBuffer.toString('hex');
        // fs.writeFileSync(PK_path, privateKey, 'utf-8');
        // const address = ethUtil.privateToAddress(pkBuffer).toString('hex');
        // fs.writeFileSync(AD_path, `0x${address}`, 'utf-8');
        // return privateKey;
    }
}

export function generateNewAddress(): string {
    const pkBuffer = randomBytes(32);
    const privateKey = pkBuffer.toString("hex");
    fs.writeFileSync(PK_path, privateKey, "utf-8");
    const address = ethUtil.privateToAddress(pkBuffer).toString("hex");
    return `0x${address}`;
}

export default Wallet;
