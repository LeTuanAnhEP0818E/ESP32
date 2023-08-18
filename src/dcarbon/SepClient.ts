import axios from "axios";
import { TypedDataDomain } from "ethers";
import { handleAxiosError } from "./utils";

export class SeparatorClient {
    private _baseUrl: string;

    constructor(baseUrl: string) {
        this._baseUrl = baseUrl;
    }

    public getSeparator(): Promise<TypedDataDomain> {
        return new Promise<TypedDataDomain>(async (resolve, reject) => {
            try {
                const response = await axios.get(`${this._baseUrl}/iots/seperator`);
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
