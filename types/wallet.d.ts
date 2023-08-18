import { ethers } from 'ethers';
interface SeparatorType {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}
declare class Wallet {
    nonce: number;
    wallet: ethers.Wallet;
    address: string;
    constructor();
    signEIP712(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string>;
    getNonce(): Promise<number>;
    getSeparator(baseURL: string): Promise<SeparatorType>;
}
export default Wallet;
