import { DCarbonMinterClient } from "../dcarbon/MinterClient";
import { CarbonContract } from "../ethers/carbon";
import DeviceWallet from "../ethers/wallet";
import { createSensor } from "../sensors";
import { ISensor, SensorType } from "../sensors/SensorTypes";
import { createPersistent } from "../utils/persistent";
import { MethaneMethodology, MMCP } from "./Methane";
import { IMethodology, MethodConfig } from "./MethodTypes";

export function createMethaneMethodology(iotWallet: DeviceWallet, config: MethodConfig): IMethodology {
    var p = createPersistent<MMCP>(config.persistent);
    var minter = new DCarbonMinterClient(config.dcarbonUrl, iotWallet);
    var contract = new CarbonContract(config.contractAddress, iotWallet);

    var sensors: Array<ISensor> = [];
    for (var i = 0; i < config.sensors.length; i++) {
        config.sensors[i].isPrimary = config.sensors[i].type == SensorType.PowerMeter;
        var sensor = createSensor(config.sensors[i]);
        sensors.push(sensor);
    }

    var med = new MethaneMethodology(p, minter, sensors, contract);
    return med;
}
export function createCookStove(iotWallet: DeviceWallet, config: MethodConfig): IMethodology {
    var p = createPersistent<MMCP>(config.persistent);
    var minter = new DCarbonMinterClient(config.dcarbonUrl, iotWallet);
    var contract = new CarbonContract(config.contractAddress, iotWallet);

    var sensors: Array<ISensor> = [];
    for (var i = 0; i < config.sensors.length; i++) {
        config.sensors[i].isPrimary = config.sensors[i].type == SensorType.Temperature;
        var sensor = createSensor(config.sensors[i]);
        sensors.push(sensor);
    }
    var med = new MethaneMethodology(p, minter, sensors, contract);
    return med;
}
export type { IMethodology };
