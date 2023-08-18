import { MethodConfig } from "./methods/MethodTypes";
import { mkdirSync, existsSync, copyFileSync } from "fs";
import DeviceWallet, { getPKFromFile, EtherSingleton } from "./ethers/wallet";
import path from "path";
import { readFileSync } from "fs";
import { IMethodology, createMethaneMethodology, createCookStove } from "./methods";
import { SeparatorClient } from "./dcarbon/SepClient";
import { SensorConfig, SensorType } from "./sensors/SensorTypes";
import { botSendMsg } from "./TelegramBot";

import "dotenv/config";

const staticPath = path.join(__dirname, "static");

const PK_dir = path.join(staticPath, "keys");
const PK_path = path.join(PK_dir, "ether.pk");

const sensorConfigPath = path.join(staticPath, "sensor_config.json");

export var med: IMethodology;

function createSensorConfigs(dcarbonUrl: string, wallet: DeviceWallet): Promise<SensorConfig[]> {
    var logPath = path.join(staticPath, "logs");
    return new Promise<Array<SensorConfig>>((resolve, reject) => {
        try {
            const buff = readFileSync(sensorConfigPath);
            var configs: Array<SensorConfig> = JSON.parse(buff.toString());
            const pathSensor = path.join(logPath, "sensors");

            for (var i = 0; i < configs.length; i++) {
                configs[i].sensorUrl = dcarbonUrl ?? "";
                configs[i].persistent = { path: path.join(pathSensor, `${configs[i].id}`), wallet: wallet };
            }
            resolve(configs);
        } catch (error) {
            console.error("Init config failed: ", error);

            reject(error);
        }
    });
}

function createConfig(iotWallet: DeviceWallet): Promise<MethodConfig> {
    return new Promise<MethodConfig>(async (resolve, reject) => {
        try {
            const dcarbonUrl = process.env.DCARBON_URL ?? "";
            const rpcUrl = process.env.RPC_PROVIDER_URL ?? "";

            console.log("Create separator client");
            const sepClient = new SeparatorClient(dcarbonUrl);

            console.log("Get separator");
            var separator = await sepClient.getSeparator();
            
            var logPath = path.join(staticPath, "logs");

            var config: MethodConfig = {
                contractAddress: separator.verifyingContract ?? "",
                rpcUrl: rpcUrl,
                dcarbonUrl: dcarbonUrl,
                persistent: { path: path.join(logPath, "method"), wallet: iotWallet },
                sensors: await createSensorConfigs(dcarbonUrl, iotWallet),
            };

            console.log("Config: ", config);
            resolve(config);
        } catch (error) {
            reject(error);
        }
    });
}


async function main() {
    try {
        mkdirSync(PK_dir, { recursive: true });
        if (existsSync("./private/ether.pk")) {
            copyFileSync("./private/ether.pk", PK_dir);
        }

        var iotWallet = EtherSingleton.createIotWallet(getPKFromFile(PK_path));
        console.log("Load iot wallet success: ", iotWallet.address);

        // var config = readMethodConfig(methodConfigPath);
        var config = await createConfig(iotWallet);
        console.log("Create methodology success: ", iotWallet.address);
        
        const restartMsg = `The device restarted at ${new Date()}`;
        const ownerID = process.env.OWNER_ID ?? 0;
        const defaultID = process.env.DEFAULT_ID ?? 0;
        botSendMsg(Number(ownerID), restartMsg);
        botSendMsg(Number(defaultID), restartMsg);

        med = createMethaneMethodology(iotWallet, config);
        //med = createCookStove(iotWallet, config);
        console.log("Star run methodology ");
    } catch (error) {
        console.error(`Init error: `, error);
        process.exit(1);
    }
}

main();
