import "../env.config";
import { describe, expect, test } from "@jest/globals";
import { ethers, toBigInt, Wallet } from "ethers";
import { CarbonContract } from "../../src/ethers/carbon";

describe("Test Carbon contract caller", () => {
    var provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
    var wallet = new Wallet(process.env.IOT_PK ?? "", provider);
    var carbon = new CarbonContract(process.env.CARBON_CONTRACT ?? "", provider);

    test("Test get nonce", async () => {
        console.log(process.env.RPC_PROVIDER_URL);

        var resp = await carbon.getNonce("0xE445517AbB524002Bb04C96F96aBb87b8B19b53d");
        expect(resp).toEqual(toBigInt(0));
        // expect(await carbon.getNonce("0xE445517AbB524002Bb04C96F96aBb87b8B19b53d"), 0);
    });

    test("Test getCoefficient", async () => {
        console.log(process.env.RPC_PROVIDER_URL);

        var resp = await carbon.getCoefficient("CH4");
        expect(resp).toEqual(toBigInt(28 * 1e9));
        // expect(await carbon.getNonce("0xE445517AbB524002Bb04C96F96aBb87b8B19b53d"), 0);
    });
});
