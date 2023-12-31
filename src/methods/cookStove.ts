import { IoTConfig } from "../env";
import DeviceWallet from "../ethers/wallet";
import { ICarbonContract } from "../ethers/carbon";
import { IMinterClient } from "../dcarbon/MinterClient";
import { IMethodology } from "./MethodTypes";
import { ISensor, SensorIndicator, sensorMetricName } from "../sensors/SensorTypes";
import { IPersistent } from "../utils/persistent";
import { EventEmitter } from "events";
import { getUnixSecond } from "../utils";

// Methane methodology checkpoint
export interface MMCP {
    currentNone: bigint;
    latestUpdate: number;
    latestPostTemp: number;
    temp: number; // Total wat/h from @latestUpdate
}

export class MethaneMethodology extends EventEmitter implements IMethodology {
    private _checkpoint: MMCP;
    private _persistent: IPersistent<MMCP>;
    private _carbonContract: ICarbonContract;
    private _wallet: DeviceWallet;
    private _sensors: Array<ISensor>;
    private _minterClient?: IMinterClient;

    constructor(p: IPersistent<MMCP>, minterClient: IMinterClient, sensors: Array<ISensor>, contract: ICarbonContract) {
        super();

        this._checkpoint = {
            currentNone: BigInt(0),
            latestUpdate: 0,
            temp: 0,
            latestPostTemp: 0,
        };
        this._persistent = p;
        this._wallet = minterClient.getWallet();
        this._minterClient = minterClient;
        this._carbonContract = contract;
        this._sensors = sensors;

        this.on(sensorMetricName, this.onMetricEmitted);
        sensors.forEach((v) => {
            v.setEmitter(this);
        });
    }

    initial(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                var latest = await this._persistent.loadLatest();
                this._checkpoint = latest ?? {
                    currentNone: BigInt(0),
                    latestUpdate: getUnixSecond(),
                    temp: 0,
                    latestPostTemp: 0,
                };
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    postMint(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                var temp = this._checkpoint.temp;
                var nonce = await this._carbonContract.getNonce(this._wallet.address);
                if (this._checkpoint.currentNone != nonce) {
                    this._checkpoint.latestUpdate = getUnixSecond();
                    this._checkpoint.currentNone = nonce;
                    this._checkpoint.temp = 0;
                    this._checkpoint.temp = 0;
                } else {
                    if (temp > 1) {
                        await this._minterClient?.postMintSign(nonce, BigInt(temp));
                        this._checkpoint.latestPostTemp = temp;
                        this._persistent.save(this._checkpoint);
                    }
                }
                resolve();
            } catch (err) {
                console.error("MM post mint error: ", err);
                reject(err);
            }
        });
    }

    getCurrentCarbon() {
        var temp = this._checkpoint.temp;
        return temp; // using 1e9 decision
    }

    getCheckPoint(): MMCP {
        return { ...this._checkpoint };
    }

    getSensor(): Array<ISensor> {
        return this._sensors;
    }

    close() {
        super.removeAllListeners();
    }

    private onMetricEmitted(metric: SensorIndicator) {
        if (!metric.isPrimary) {
            return;
        }
        // console.log("On metric: ", metric);

        //this._checkpoint.totalWh += metric.indicator.value ?? 0;
        if (Array.isArray(metric.indicator.value)) {
            // Handle the case where metric.indicator.value is an array of numbers
            for (const value of metric.indicator.value) {
                this._checkpoint.temp += value ?? 0;
            }
        } else if (typeof metric.indicator.value === 'number') {
            // Handle the case where metric.indicator.value is a single number
            this._checkpoint.temp += metric.indicator.value ?? 0;
        }
        
        this._checkpoint.latestUpdate = getUnixSecond();
    }
}
