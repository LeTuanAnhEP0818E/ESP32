import { ISensorClient, SensorClient } from "../dcarbon/SensorMetricClient";
import DeviceWallet from "../ethers/wallet";
import { createPersistent, IPersistent, PersistentWithSign } from "../utils/persistent";
import { IPowerMeterReader } from "./PowerMeterReader";
import { EPSILON, Indicator, IndicatorIn, ISensor, Monitoring, SensorConfig, sensorMetricName, SensorType } from "./SensorTypes";
import { EventEmitter } from "events";
import { getUnixSecond, sleepPromise } from "../utils";

// const EPSILON = 1 / 1e6;

// function getUnixSecond(): number {
//     return Math.floor(Date.now() / 1000);
// }

interface PMCheckpoint {
    totalWH: number;
    latest: number;
    indicator?: Indicator;
}

export class PowerMeterSerialSensor implements ISensor {
    private _config: SensorConfig;
    private _checkpoint: PMCheckpoint;
    private _reader: IPowerMeterReader;
    private _metricClient?: ISensorClient;
    private _emitter?: EventEmitter;
    private _persistent: IPersistent<PMCheckpoint>;
    private _interval: any;

    constructor(config: SensorConfig, reader: IPowerMeterReader, client?: ISensorClient) {
        this._config = config;
        this._reader = reader;
        this._checkpoint = { totalWH: 0, latest: getUnixSecond() };
        this._persistent = createPersistent<PMCheckpoint>(config.persistent);
        this._metricClient = client;

        this._interval = setInterval(async () => {
            try {
                var indicator = await this.getIndicatorIn();
                console.log("PM Indicator: ", indicator);
                if (indicator) {
                    await sleepPromise(1000);
                    this._persistent.save(this._checkpoint);
                    this._metricClient?.postMetric(indicator.from, indicator.to, indicator.indicator);
                    this._emitter?.emit(sensorMetricName, {
                        ...indicator,
                        isPrimary: config.isPrimary,
                        // sensorId: config.sensorId,
                    });
                }
            } catch (error) {
                console.error("Post metric error: ", error);
            }
        }, config.metricInterval);
    }

    getId(): number {
        return this._config.id;
    }

    initial(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                var latest = await this._persistent.loadLatest();
                if (latest) {
                    this._checkpoint = latest;
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    isChanged(): boolean {
        return Math.abs(this._reader.getTotalWH() - this._checkpoint.totalWH) > EPSILON;
    }

    isPrimary(): boolean {
        return this._config.isPrimary;
    }

    getType(): SensorType {
        return SensorType.PowerMeter;
    }

    getIndicatorIn(): Promise<IndicatorIn | null> {
        return new Promise<IndicatorIn | null>(async (resolve, reject) => {
            try {
                var from = this._checkpoint.latest;
                var now = getUnixSecond();
                var val = this._reader.getTotalWH();
                var delta = val - this._checkpoint.totalWH;
                var phases = this._reader.phases;

                console.log(`Latest totalWH:${this._checkpoint.totalWH}  value:${val}`);
                console.log(`Phases: ${phases}`);
                for (let j = 0; j < 3; j++) {
                    if (phases) {
                        console.log(`Phase[${j + 1}]: ${phases[j].U.toFixed(1)} V~, ${phases[j].I.toFixed(2)} A, Φ = ${phases[j].cosPhi.toFixed(2)}`);
                    }
                }
                var indicator: IndicatorIn | null = null;
                if (delta < EPSILON || from == 0) {
                    this._checkpoint.latest = now;
                    console.log();

                    resolve(null);
                    return;
                }

                indicator = {
                    from: from,
                    to: now,
                    indicator: {
                        value: delta,
                    },
                };

                this._checkpoint.latest = now;
                this._checkpoint.totalWH = val;

                this._persistent.save(this._checkpoint);
                resolve(indicator);
            } catch (error) {
                reject(error);
            }
        });
    }

    getCurrentIndicator(): Indicator | null {
        var val = this._reader.getTotalWH();
        var delta = val - this._checkpoint.totalWH;
        var indicator: Indicator | null = {
            value: delta,
        };
        return indicator;
    }

    setEmitter(emitter: EventEmitter): void {
        this._emitter = emitter;
    }

    close(): void {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    monitoring(): Monitoring | null {
        var val = this._reader.getTotalWH();
        var monitoring: Monitoring | null = {
            total: val,
            phases: this._reader.phases,
        }        
        return monitoring
    }
}
