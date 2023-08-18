import "../env.config";
import { describe, expect, test } from "@jest/globals";
import { DCarbonMinterClient } from "../../src/dcarbon/MinterClient";
import { ethers, Wallet } from "ethers";
import DeviceWallet from "../../src/ethers/wallet";

describe("DCarbon_Minter_Client", () => {
    var dcarbonUrl = process.env.DCARBON_URL ?? "";
    var provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
    var wallet = new DeviceWallet(true, process.env.IOT_PK ?? "", provider);
    var client = new DCarbonMinterClient(dcarbonUrl, wallet);

    test("PostMintSign_Success", async () => {
        var amount = BigInt(300);

        var data = await client.postMintSign(BigInt(1), amount);
        console.log("Mint sig response: ", data);
    });

    test("PostMintSign_Getseparator", async () => {
        var sep = await client.getSeparator();
        var network = await provider.getNetwork();
        // console.log("separator: ", sep);
        expect(sep.name).toEqual("CARBON");
        expect(sep.chainId).toEqual(BigInt(network.chainId));
    });
});
