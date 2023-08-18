import { PowerMeterSerialSensor } from "./PowerMeterSensor";
import { MockPowerMeterReader, PowerMeterReader } from "./PowerMeterReader";

import { GPSSensor } from "./GPSSensor";
export { ISensor, SensorConfig } from "./SensorTypes";

import { ThermocoupleSensor } from "./ThermocoupleSensor";
import { ThermocoupleMockReader, ThermocoupleReader } from "./ThermocoupleReader";

import { ISensor, SensorConfig, SensorType } from "./SensorTypes";
import { GPSMockReader, GPSReader } from "./GPSReader";
import { ISensorClient, SensorClient } from "../dcarbon/SensorMetricClient";
import { EtherSingleton } from "../ethers/wallet";
import { createPersistent } from '../utils/persistent';

export function createSensor(config: SensorConfig): ISensor {
    switch (config.type) {
        case SensorType.Flow:
            break;
        case SensorType.PowerMeter:
            return createPowermeter(config);
        case SensorType.GPS:
            return createGPSSensor(config);
        case SensorType.Temperature:
            return createThermocupleSensor(config);
        default:
            break;
    }
    throw new Error("Invalid sensor type");
}

export { PowerMeterSerialSensor, GPSSensor , ThermocoupleSensor};

function createPowermeter(config: SensorConfig): PowerMeterSerialSensor {
    var client: ISensorClient = new SensorClient(
        config.id,
        config.sensorUrl,
        EtherSingleton.getSensorWallet(config.wallet)
    );
    var reader = config.isMock ? new MockPowerMeterReader() : new PowerMeterReader(config.connect);
    var sensor = new PowerMeterSerialSensor(config, reader, client);
    return sensor;
}

function createGPSSensor(config: SensorConfig): GPSSensor {
    var client: ISensorClient = new SensorClient(
        config.id,
        config.sensorUrl,
        EtherSingleton.getSensorWallet(config.wallet)
    );
    var reader = config.isMock ? new GPSMockReader() : new GPSReader(config.connect);
    var sensor = new GPSSensor(reader, client, config);
    return sensor;
}

function createThermocupleSensor(config: SensorConfig): ThermocoupleSensor{
    var client: ISensorClient = new SensorClient(
        config.id,
        config.sensorUrl,
        EtherSingleton.getSensorWallet(config.wallet)
    );
    var reader = config.isMock ? new ThermocoupleMockReader() : new ThermocoupleReader(config.connect);
    var sensor = new ThermocoupleSensor(reader, client, config);
    return sensor;   
}