
import { ISensorClient, SensorClient } from "../dcarbon/SensorMetricClient";
import DeviceWallet from "../ethers/wallet";
import { createPersistent, IPersistent, PersistentWithSign } from "../utils/persistent";
import { Thermocouple, IThermocoupleReader } from './ThermocoupleReader';
import { EPSILON, Indicator, IndicatorIn, ISensor, SensorConfig, sensorMetricName, SensorType, Monitoring } from "./SensorTypes";
import { EventEmitter } from "events";
import { getUnixSecond, sleepPromise } from "../utils";
//import fs from 'fs';

interface ThermocoupleCheckpoint {
    latest: number;
    temperature: Thermocouple;
}

export class ThermocoupleSensor implements ISensor {
  
    private _config: SensorConfig;
    private _checkpoin: ThermocoupleCheckpoint;
    private _reader: IThermocoupleReader;
    private _metricClient?: ISensorClient;
    private _emitter?: EventEmitter;
    private _persistent: IPersistent<ThermocoupleCheckpoint>;
    private _interval: any;

    constructor(reader: IThermocoupleReader, client: ISensorClient, config: SensorConfig) {
        // ...
        this._config = config;
        this._reader = reader;
        this._checkpoin = { latest: getUnixSecond(), temperature:{ temp : 0}};
        this._persistent = createPersistent<ThermocoupleCheckpoint>(config.persistent);
        this._metricClient = client;

        this._interval = setInterval(async () => {
            try {
                var indicator = await this.getIndicatorIn();
                console.log("Temp Indicator: ", indicator);
                if (indicator) {
                    await sleepPromise(1000);
                    this._persistent.save(this._checkpoin);
                    this._metricClient?.postMetric(indicator.from, indicator.to, indicator.indicator);
                    this._emitter?.emit(sensorMetricName, {
                        ...indicator,
                        isPrimary: config.isPrimary,
                        // sensorId: config.sensorId,
                    });
                }
            } catch (error) {
                console.error("Temperature get error: ", error);
            }
        }, config.metricInterval);
    }
    getId(): number {
        return this._config.id;
    }
    isPrimary(): boolean {
        return this._config.isPrimary;
    }
    getType(): SensorType {
        return SensorType.Temperature;
    }
    initial(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                var latest = await this._persistent.loadLatest();
                if (latest) {
                    this._checkpoin = latest;
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    getIndicatorIn(): Promise<IndicatorIn | null> {
        return new Promise<IndicatorIn | null>(async (resolve, reject) => {
            try {
                // var from = this._checkpoin.latest;
                // var now = getUnixSecond();
                // var latestTemp = this._reader.readTemp();          
                var now = getUnixSecond();
                var latestTemp = (await this._reader.readTemp()).temp;
                if (!isTheSameTemperature(latestTemp, this._checkpoin.temperature.temp)) {
                    resolve({
                        from: this._checkpoin.latest,
                        to: now,
                        indicator: { value: latestTemp},
                    });
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.error("Thermocouple get temperature error: ", error);
                reject(error);
            }
        });
    }

    getCurrentIndicator(): Indicator | null {
        return { value: this._checkpoin.temperature.temp };
    }
    setEmitter(emitter: EventEmitter): void {
        this._emitter = emitter;
    }
    close() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
    monitoring(): Monitoring | null {
        var monitoring: Monitoring | null = {
            temp: this._checkpoin.temperature.temp,

        }        
        return monitoring
    }
}
// Hàm kiểm tra sự thay đổi của nhiệt độ từ Thermocouple
function isTheSameTemperature(t1: number | number[], t2: number | number[]): boolean {
    if (typeof t1 === 'number' && typeof t2 === 'number') {
        return Math.abs(t1 - t2) < EPSILON;
    }

    if (Array.isArray(t1) && Array.isArray(t2) && t1.length === t2.length) {
        for (let i = 0; i < t1.length; i++) {
            if (Math.abs(t1[i] - t2[i]) >= EPSILON) {
                return false;
            }
        }
        return true;
    }

    return false; 
}