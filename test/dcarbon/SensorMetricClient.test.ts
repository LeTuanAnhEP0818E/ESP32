import "../env.config";
import { describe, expect, test } from "@jest/globals";
import { ethers } from "ethers";
import DeviceWallet from "../../src/ethers/wallet";
import { SensorClient } from "../../src/dcarbon/SensorMetricClient";
import { getUnixSecond } from "../../src/utils";

describe("DCarbon_SensorMetric_Client", () => {
    var dcarbonUrl = process.env.DCARBON_URL ?? "";
    var sensorPk = process.env.SENSOR_PK ?? "";
    var iotPk = process.env.IOT_PK ?? "";

    var provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);

    test("PostMetric_SensorSign_Success", async () => {
        var sensorWallet = new DeviceWallet(false, sensorPk, provider);
        var client = new SensorClient(77, dcarbonUrl, sensorWallet);
        var now = getUnixSecond();
        var from = now - 15;
        await client.postMetric(now, from, { value: 200 });
    });

    test("PostMetric_IotSign_Success", async () => {
        var wallet = new DeviceWallet(true, iotPk, provider);
        var client = new SensorClient(81, dcarbonUrl, wallet);
        var now = getUnixSecond();
        var from = now - 15;
        await client.postMetric(now, from, { value: 200 });
    });
});
