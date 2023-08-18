/**
 * The main app work flow: see `app.spec.yaml`
 */
import { IoTConfig, BotConfig } from './env';

import { botSendMsg } from './TelegramBot';
const restartMsg = `The device restarted at ${new Date()}`;
console.log(restartMsg);
botSendMsg(BotConfig.ownerID, restartMsg);
botSendMsg(BotConfig.defaultAuth, restartMsg);

// import PowerMeter from "./mock/PowerMeter";
// import GPS from "./mock/GPS";
import PowerMeter from "./PowerMeter";
import GPS from "./GPS";
import Wallet from './wallet';
import { splitSignature, numberToHexStr } from './helpers';

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Define the file paths
const statusDir = path.join(__dirname, 'status');
if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir);
}
const registeredFilePath = path.join(statusDir, 'registered.json');
const sensorsRegisteredFilePath = path.join(statusDir, 'sensorsRegistered.json');
const sensorsStatusFilePath = path.join(statusDir, 'sensorsStatus.json')

// Initialize the components
const powerMeter = new PowerMeter();
const gps = new GPS();
const wallet = new Wallet();
// Exports for use outside this module
export { powerMeter, gps };

// let internetConnected = true;

// Main function to run the app
async function main() {
    if (!checkRegisterIoT() || !checkRegisterSensors() || !checkChangeSensorsStatus()) {
        console.error(`This device hasn't registered to dCarbon Server. Please initialize new project by'dCarbon-cli'`);
        process.exit(1);
    }
    // Start the main loop
    while (true) {
        try {
            // Delay for each iteration at first
            await new Promise(resolve => setTimeout(resolve, IoTConfig.interval));
            // Pre-conditions checking: internetConnected? register and change sensors's status?
            // if (!internetConnected) return;

            postMintSign(powerMeter.totalWh);
            // Prepare GPS & sensors data --> sign, and send 
            sensorsPostUpdate();

        } catch (error: unknown) {
            console.error(`@main: ${error}`);
            if (axios.isAxiosError(error)) {
                console.error(error.response?.data);
            }
            // Wait for 5s if any error catched
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

//----- ***Call the main function*** -----//
main();
//-----------------******-----------------//


//----- Supporting Functions: -----//

function checkRegisterIoT(): boolean {
    if (fs.existsSync(registeredFilePath)) {
        const data = fs.readFileSync(registeredFilePath, 'utf-8');
        const registerObj = JSON.parse(data);
        return (registerObj.address === wallet.address);
    } else {
        return false;
    }
}

function checkRegisterSensors(): boolean {
    if (fs.existsSync(sensorsRegisteredFilePath)) {
        const data = fs.readFileSync(sensorsRegisteredFilePath, 'utf-8');
        const registerObj = JSON.parse(data);
        return (registerObj.address === wallet.address)
    } else {
        return false;
    }
}

function checkChangeSensorsStatus(): boolean {
    if (fs.existsSync(sensorsStatusFilePath)) {
        const data = fs.readFileSync(sensorsStatusFilePath, 'utf-8');
        const registerObj = JSON.parse(data);
        return (registerObj.status === 10);
    } else {
        return false;
    }
}

interface SENSORS_DATA {
    from: number;
    to: number;
    indicator: {
        value: string;
        lat: string;
        lng: string;
    };
    address: string;
}

async function sensorsPostUpdate() {
    if (!gps.changed && !powerMeter.changed) {
        return;
    }
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const sensorsData: SENSORS_DATA = {
        from: timestamp - 3,
        to: timestamp - 2,
        indicator: {
            value: powerMeter.totalWh.toString(),
            lat: gps.latitude,
            lng: gps.longitude
        },
        address: wallet.address
    }

    const serialized_data = JSON.stringify(sensorsData);
    const buffer = Buffer.from(serialized_data, 'utf8');
    const hex_string = '0x' + buffer.toString('hex');
    const signature = await wallet.wallet.signMessage(buffer);

    const payload = {
        data: hex_string,
        sensorAddress: wallet.address,
        signed: signature
    }

    axios.post(IoTConfig.baseURL + '/sensors/sm/create', payload)
        .then((response) => {
            // console.log('gps:', gps);
            // console.log('Response:', response.data);
            return;
        })
        .catch((error) => {
            console.error(`POST /sensors/sm/create: ${error}`);
            console.error(error.response.data);
        });
}


const mintTypes = {
    Mint: [
        { name: "iot", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
};

interface MINT_DATA {
    iot: string;
    amount: string;
    nonce: number;
}

async function postMintSign(totalWh: number) {
    if (!powerMeter.changed) {
        return;
    }
    // get nonce and domain speparator (don't worry, the wallet always returns)
    const nonce = await wallet.getNonce();
    const domain = await wallet.getSeparator(IoTConfig.baseURL);
    // Collect the data to be signed
    const dCarbon = Math.round(totalWh * IoTConfig.MWH_TO_TON_CO2 * 1e3); // using 1e9 multiplier 

    const data: MINT_DATA = {
        iot: wallet.address,
        amount: numberToHexStr(dCarbon),
        nonce: Number(nonce + BigInt(1))
    }

    // produce signature and prepare minPayload
    const signature = await wallet.signEIP712(domain, mintTypes, data);
    const rsv = splitSignature(signature);
    const mintPayload = { ...data, ...rsv };

    // Sending the signed payload
    axios.post(IoTConfig.baseURL + `/iots/${wallet.address}/mint-sign`, mintPayload)
        .then((response) => {
            // console.log('Response:', response.data);
            return;
        })
        .catch((error) => {
            console.error(`POST /iots/${wallet.address}/mint-sign: ${error}`);
            console.error(error.response.data);
        });
}