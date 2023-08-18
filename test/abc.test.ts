import { describe, expect, test } from "@jest/globals";
import { ethers } from "ethers";

import { MWH_TO_TON_C02 } from "../src/config/dCarbon_factor";
import { randomPk } from "../src/ethers/wallet";
import { MethodConfig } from "../src/methods/MethodTypes";

describe("Test Carbon contract caller", () => {
    test("Test getCoefficient", async () => {
        console.log("mwh = ", MWH_TO_TON_C02 / 1e3);
    });

    test("Test getCoefficient", async () => {
        const privateKey = randomPk();
        console.log("private key: ", privateKey);
    });

    test("", () => {
        // var medConfig: MethodConfig = {
        //     rpcUrl: "",
        //     contractAddress: "",
        //     dcarbonUrl: "",
        //     persistent: { path: "", wallet: "" },
        //     sensors: [
        //         {
        //             connect: { path: "", bauRate: 1 },
        //         },
        //     ],
        // };
    });
});
