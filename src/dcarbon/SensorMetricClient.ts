import axios, { AxiosError } from "axios";
import DeviceWallet from "../ethers/wallet";
import { handleAxiosError } from "./utils";

export abstract class ISensorClient {
    abstract postMetric(from: number, to: number, indicator: any): Promise<void>;
}

export class SensorClient extends ISensorClient {
    private _baseUrl: string;
    private _wallet: DeviceWallet;
    private _id: number;

    constructor(id: number, baseUrl: string, wallet: DeviceWallet) {
        super();
        this._baseUrl = baseUrl;
        this._wallet = wallet;
        this._id = id;
    }

    postMetric(from: number, to: number, indicator: any): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                var data = {
                    from: from,
                    to: to,
                    indicator: indicator,
                    address: this._wallet.address,
                };

                const serialized_data = JSON.stringify(data);
                const buffer = Buffer.from(serialized_data, "utf8");
                const hex_string = "0x" + buffer.toString("hex");
                const signature = await this._wallet.signMessage(buffer);

                const payload = {
                    data: hex_string,
                    signed: signature,
                    isIotSign: this._wallet.isIot(),
                    signAddress: await this._wallet.getAddress(),
                    sensorId: this._id,
                };
                // console.log(`Payload for metric: `, payload);

                await axios.post(`${this._baseUrl}/sensors/sm/create-sign`, payload);
                resolve();
            } catch (error) {
                console.log(handleAxiosError(error, "Post metric"));
                resolve();
                // reject(handleAxiosError(error));
            }
        });
    }
}
