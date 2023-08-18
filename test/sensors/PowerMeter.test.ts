import "../env.config";
import { describe, expect, test } from "@jest/globals";

import { MockPowerMeterReader } from "../../src/sensors/PowerMeterReader";
import { PowerMeterSerialSensor } from "../../src/sensors";
import DeviceWallet from "../../src/ethers/wallet";
import { sleepPromise } from "../../src/utils";
import { SensorConfig } from "../../src/sensors/Sensor";

describe("PM_Sensor", () => {
    var wallet = new DeviceWallet(true, process.env.IOT_PK ?? "");
    var mockReader = new MockPowerMeterReader();
    var pmConfig: SensorConfig = {
        isAccumulate: true,
        isPrimary: true,
        metricInterval: 100,
        persistent: "./static/test/sensors",
        wallet: wallet,
    };

    test("PM_Sensor_GetCurrent", async () => {
        var sersor = new PowerMeterSerialSensor(pmConfig, mockReader);
        mockReader.totalWh = 200;

        await sleepPromise(150);

        var current = sersor.getCurrentIndicator();
        console.log("Current: ", current);

        sersor.close();
        await sleepPromise(500);
    });

    test("PM_Sensor_GetIndicator", async () => {
        var sersor = new PowerMeterSerialSensor(pmConfig, mockReader);
        mockReader.totalWh = 400;

        await sleepPromise(1.1 * 1000);

        var current = await sersor.getIndicatorIn();
        console.log("Current: ", current);

        sersor.close();
        await sleepPromise(500);
    });
});
