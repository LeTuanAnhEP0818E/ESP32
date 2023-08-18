import { PersistentConfig } from "../utils";
import { SensorConfig } from "../sensors";
import { ISensor } from "../sensors/SensorTypes";

export interface MethodConfig {
    dcarbonUrl: string;
    rpcUrl: string;
    contractAddress: string;
    persistent: PersistentConfig;
    sensors: Array<SensorConfig>;
}

export interface SensorCP {
    latestUpdate: number;
    latestValue: number;
}

export interface IMethodology {
    initial(): Promise<void>;
    postMint(): Promise<void>;
    getSensor(): Array<ISensor>;
}
