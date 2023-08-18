import { ISensorClient } from "../dcarbon/SensorMetricClient";
import { createPersistent, getUnixSecond, IPersistent } from "../utils";
import { IGPSReader, GPSLoc } from "./GPSReader";
import { EPSILON, Indicator, IndicatorIn, ISensor, SensorConfig, sensorMetricName, SensorType, Monitoring } from "./SensorTypes";
import { EventEmitter } from "events";

interface GPSCheckpoint {
    latest: number;
    loc: GPSLoc;
}

function isTheSame(p1: GPSLoc, p2: GPSLoc): boolean {
    return p1.longitude - p2.longitude < EPSILON && p1.latitude - p2.latitude < EPSILON;
}

export class GPSSensor implements ISensor {
    private _reader: IGPSReader;
    private _persistent: IPersistent<GPSCheckpoint>;
    private _client: ISensorClient;
    private _emitter?: EventEmitter;
    private _config: SensorConfig;
    private _checkpoint: GPSCheckpoint;
    private _interval: any;

    constructor(reader: IGPSReader, client: ISensorClient, config: SensorConfig) {
        this._reader = reader;
        this._persistent = createPersistent<GPSCheckpoint>(config.persistent);
        this._client = client;
        this._config = config;
        this._checkpoint = { latest: getUnixSecond(), loc: { latitude: 0, longitude: 0 } };

        this._interval = setInterval(async () => {
            try {
                var indicator = await this.getIndicatorIn();
                if (indicator) {
                    this._checkpoint.loc = {latitude: indicator.indicator.lat ?? 0, longitude: indicator.indicator.lng ?? 0};
                    this._persistent.save(this._checkpoint);
                    this._client?.postMetric(indicator.from, indicator.to, indicator.indicator);
                    this._emitter?.emit(sensorMetricName, {
                        ...indicator,
                        isPrimary: config.isPrimary,
                        // sensorId: config.sensorId,
                    });
                }
            } catch (error) {
                console.error("GPS get gps error: ", error);
            }
        }, this._config.metricInterval);
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

    isPrimary(): boolean {
        return this._config.isPrimary;
    }

    getType(): SensorType {
        return SensorType.GPS;
    }

    getIndicatorIn(): Promise<IndicatorIn | null> {
        return new Promise<IndicatorIn | null>(async (resolve, reject) => {
            try {
                var now = getUnixSecond();
                var latestGPS = this._reader.getGPS();
                console.log(`current:${JSON.stringify(latestGPS)} checkpoint:${JSON.stringify(this._checkpoint.loc)}`);
                if (!isTheSame(latestGPS, this._checkpoint.loc)) {
                    // console.log(
                    //     `current:${JSON.stringify(latestGPS)} checkpoint:${JSON.stringify(this._checkpoint.loc)}`
                    // );

                    resolve({
                        from: this._checkpoint.latest,
                        to: now,
                        indicator: { lat: latestGPS.latitude, lng: latestGPS.longitude },
                    });
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.log("GPS try update error: ", error);
                reject(error);
            }
        });
    }

    getCurrentIndicator(): Indicator | null {
        return { lat: this._checkpoint.loc.latitude, lng: this._checkpoint.loc.longitude };
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
        const empty = {} as Monitoring
        return empty
    }
}
