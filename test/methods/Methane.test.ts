import "../env.config";
import { describe, expect, test } from "@jest/globals";

import { MockPowerMeterReader } from "../../src/sensors/PowerMeterReader";
import DeviceWallet from "../../src/ethers/wallet";
import { PowerMeterSerialSensor } from "../../src/sensors";
import { sleepPromise } from "../../src/utils";
import { SensorConfig } from "../../src/sensors/Sensor";
import { MethaneMethodology, MMCP } from "../../src/methods";
import { PersistentWithSign } from "../../src/utils/persistent";
import { DCarbonMinterClient } from "../../src/dcarbon/MinterClient";
import { ethers } from "ethers";
import { CarbonContract } from "../../src/ethers/carbon";

describe("Methane_Method", () => {
    var dcbUrl = process.env.DCARBON_URL ?? "";
    var carbonContractAddr = process.env.CARBON_CONTRACT ?? "";

    var provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
    var wallet = new DeviceWallet(true, process.env.IOT_PK ?? "", provider);
    var carbonContract = new CarbonContract(carbonContractAddr, wallet);

    var mockReader = new MockPowerMeterReader();
    var pmConfig: SensorConfig = {
        isAccumulate: true,
        isPrimary: true,
        metricInterval: 100,
        persistent: "./static/test/sensors",
        wallet: wallet,
    };

    var client = new DCarbonMinterClient(dcbUrl, wallet);
    var p = new PersistentWithSign<MMCP>("./static/test/method", wallet);

    test("Methane_Method", async () => {
        try {
            var pmSersor = new PowerMeterSerialSensor(pmConfig, mockReader);
            await pmSersor.initial();

            var initVal = pmSersor.getCurrentIndicator();
            mockReader.totalWh = initVal?.value ?? 0;
            if (initVal?.value && initVal?.value < 0) {
                mockReader.totalWh = Math.abs(initVal?.value ?? 0);
            }

            var methane = new MethaneMethodology(p, client, [pmSersor], carbonContract);
            await methane.initial();
            var initCarbon = methane.getCurrentCarbon();

            mockReader.totalWh += 100;
            await sleepPromise(150);

            var current = methane.getCurrentCarbon();
            console.log(`InitCarbon:${initCarbon} Current:${current}`);

            mockReader.totalWh += 100;
            await sleepPromise(150);

            current = methane.getCurrentCarbon();
            console.log(`InitCarbon:${initCarbon} Current:${current}`);

            await methane.postMint();

            await sleepPromise(1200);
            pmSersor.close();
        } catch (err) {
            console.log("error: ", err);
        }
    });
});
