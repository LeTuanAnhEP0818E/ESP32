import DeviceWallet from "../ethers/wallet";
import { EventEmitter } from "events";
import { PersistentConfig } from "../utils";

export const sensorMetricName = "metric";
export const EPSILON = 1 / 1e6;
export const StartSystem = 1578104101;

export interface Indicator {
    //temp?:  number | number[];
    value?: number  | number[];
    lat?: number;
    lng?: number;
}

export interface IndicatorIn {
    from: number;
    to: number;
    indicator: Indicator;
}

export interface SensorIndicator extends IndicatorIn {
    sensorId: number;
    isPrimary: boolean;
}

export interface Monitoring {
    temp?: number | number[];
    total?: number;
    phases?: {
        U: number;
        I: number;
        cosPhi: number;
    }[];
}

export enum SensorType {
    None = 0,
    Flow = 1,
    PowerMeter = 2,
    GPS = 3,
    Temperature = 4,
}

export interface SerialConfig {
    path: string;
    baudRate: number;
}


export interface SensorConfig {
    id: number;
    isPrimary: boolean;
    isMock?: boolean;
    sensorUrl: string;
    metricInterval: number; // milisecond
    wallet: string; // Private key of sensor or empty (Private key of iot)
    type: SensorType;
    connect: SerialConfig | any;
    persistent: PersistentConfig;
    // isIndepend: boolean;
    // isAccumulate: boolean;
}

export interface ISensor {
    initial(): Promise<void>;
    isPrimary(): boolean;
    getId(): number;
    getType(): SensorType;
    getIndicatorIn(): Promise<IndicatorIn | null>;
    getCurrentIndicator(): Indicator | null;
    setEmitter(emitter: EventEmitter): void;
    monitoring(): Monitoring | null;
}
