import { BotConfig } from './env';
import TelegramBot from 'node-telegram-bot-api';
import { med } from './index';
import { PowerMeterSerialSensor, GPSSensor, ThermocoupleSensor } from './sensors';
import { IoTConfig } from './env';

import fs from 'fs';
import path from 'path';

const statusDir = path.join(__dirname, 'status');
const iotRegistered_path = path.join(statusDir, 'registered.json');
const sensorsRegistered_path = path.join(statusDir, 'sensorsStatus.json')

let botToken = '6283023676:AAHiRBK3OYGMnLXXePQjDn_l6qU7dn0V7fc'; // this is dCarbon_IoT_Test_Bot
const configDir = path.join(__dirname, 'config');
const telegramFilePath = path.join(configDir, 'telegram.config.json');
if (fs.existsSync(telegramFilePath)) {
    const data = fs.readFileSync(telegramFilePath, 'utf-8');
    const telegramObj = JSON.parse(data);
    botToken = telegramObj.token;
} else {
    console.error(`No telegram bot token was found on ${telegramFilePath}. Please initialize your project fist by running 'dCarbon-cli'`);
    process.exit(1);
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(botToken, { polling: true });

interface CA_MAP {
    [command: string]: (chatId: number, arg2: void | string) => void;
}

const command_action_map: CA_MAP = {
    "/authorize": authorize_id,
    "/help": display_help,
    "/listID": list_authorized_ids,

    "/report_Energy": reportEnergy,
    "/report_Phases": reportPhases,
    "/report_DCarbon": reportDCarbon,
    "/report_GPS": reportGPS,

    // "/monitor_GPS": monitorGPS,
    // "/monitor_DCarbon": monitorDCarbon,
    // "/monitor_Phases": monitorPhases,
    // "/monitor_Energy": monitorEnergy,
    // "/stop_Monitoring": stopMonitoring,

    "/IoT_Registered_Info": iotRegisteredInfo,
    "/Sensors_Registered_Info": sensorsRegisteredInfo,
    "/MWH_TO_DCARBON_Factor": mwhToDcarbonFactor,
    "/pushPM2Logs": pushPM2Logs
};

const admin_commands: CA_MAP = {
    "/fetchPowerLogs": display_help,
    "/fetchGPSLogs": display_help,
    "/fetchPM2Logs": display_help,
    "/fetchPM2Errs": display_help,
    "/gitUpdate": display_help,
    "/pushPM2Logs": display_help,
    // "/executeCMD": executeCMD
};

const helpText = `
/help - show help

------------ Reports ------------
/report_Energy - display the total generated kWh
/report_Phases - display U, I, cosPhi of the three phases
/report_DCarbon - display the total minted Carbon Credits
/report_GPS - report the device's current position

------------ Infos ------------
/IoT_Registered_Info - display this device registered information
/Sensors_Registered_Info - display this device's sensors registered information
/MWH_TO_DCARBON_Factor - display this device's MWH_TO_TON_CO2 factor
`;

const authHelp = `
------------ Admins ------------
/authorize <User ID Number>,
/listID - list authorized IDs,
/pushPM2Logs - push PM2 logs to the github repo
`;

const adminHelp = `
/executeCMD "command -args" - execute a terminal command and display its output

/fetchPowerLogs
/fetchGPSLogs
/fetchPM2Logs - print out the most current PM2's out.log file
/fetchPM2Errs - print out the most current PM2's error.log file
/gitUpdate - update the IoT's app source code from the github repo
/pushPM2Logs - push all the PM2's logs to the device's log github repo
`;

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (chatId === BotConfig.ownerID) {
        if (checkExecuteCMD(msg)) return;
    }

    if (isAuthorized(chatId)) {
        const inputList = msg.text?.split(' ');
        if (inputList?.length === 1) {
            const action = command_action_map[inputList[0]];
            if (action !== undefined) {
                action(chatId);
            } else {
                display_help(chatId);
            }
        }
        if (inputList?.length === 2) {
            const [cmd, arg] = inputList;
            const action = command_action_map[cmd];
            if (action !== undefined) {
                action(chatId, arg);
            } else {
                display_help(chatId);
            }
        }
    } else if (msg.text?.toLowerCase() === "hi") {
        botSendMsg(chatId, `Hi ${chatId}`);
    }

});

function checkExecuteCMD(msg: TelegramBot.Message): boolean {
    const regex = /^\/executeCMD +"(.*?)"/;
    const match = msg.text?.match(regex);

    if (match) {
        const [, command] = match;
        executeCMD(msg.chat.id, command);
        return true;
    } else {
        return false;
    }
}

function display_help(chatId: number) {
    botSendMsg(chatId, helpText);
    if (chatId === BotConfig.ownerID || chatId === BotConfig.defaultAuth) {
        botSendMsg(chatId, authHelp);
    }
}

let authorizedIDs: number[] = [BotConfig.defaultAuth];
function authorize_id(chatId: number, idStr: string | void) {
    if (!isAuthorized(chatId)) return;
    if (!idStr) {
        botSendMsg(chatId, helpText);
        return;
    }
    const idNumber = parseInt(idStr);
    if (idNumber > 0) {
        if (!authorizedIDs.includes(idNumber)) {
            authorizedIDs.push(idNumber);
        }
        botSendMsg(chatId, `User ID ${idNumber} has been authorized`);
    } else {
        botSendMsg(chatId, `Invalid ID`);
    }
}

function isAuthorized(ID: number): boolean {
    return (ID === BotConfig.ownerID || authorizedIDs.includes(ID))
}

function list_authorized_ids(chatId: number) {
    botSendMsg(chatId, `Authorized IDs: ${authorizedIDs.join(", ")}`);
}

function iotRegisteredInfo(chatId: number) {
    let message = '';
    if (fs.existsSync(iotRegistered_path)) {
        message = fs.readFileSync(iotRegistered_path, 'utf-8');
    } else {
        message = `This device hasn't registered`
    }
    botSendMsg(chatId, message);
}

function sensorsRegisteredInfo(chatId: number) {
    let message = '';
    if (fs.existsSync(sensorsRegistered_path)) {
        message = fs.readFileSync(sensorsRegistered_path, 'utf-8');
    } else {
        message = `Sensors haven't registered`
    }
    botSendMsg(chatId, message);
}

function mwhToDcarbonFactor(chatId: number) {
    const message = `MWH_TO_DCARBON factor: ${IoTConfig.MWH_TO_TON_CO2}`;
    botSendMsg(chatId, message);
}

function reportEnergy(chatId: number) {
    const sensors = med.getSensor();
    const powerMeter = sensors.find(sensor => sensor.getType() == 2);
    if (powerMeter) {
        const total = powerMeter.monitoring()?.total;
        if (total) {
                botSendMsg(chatId, `Energy: ${(total /1000).toFixed(3)} kWh`);
        } else {
            botSendMsg(chatId, `Power meter is not ready`);
        }
    } else {
        botSendMsg(chatId, `Power meter not found`);
    }
}

function reportPhases(chatId: number) {
    const sensors = med.getSensor();
    const powerMeter = sensors.find(sensor => sensor.getType() === 2);

    if (powerMeter) {
        const monitoringPhases = powerMeter.monitoring()?.phases;
        if (monitoringPhases) {
            monitoringPhases.forEach((phase, index) => {
                botSendMsg(chatId, `Phase[${index + 1}]: ${phase.U.toFixed(1)} V~, ${phase.I.toFixed(2)} A, Φ = ${phase.cosPhi.toFixed(2)}`);
            });
        } else {
            botSendMsg(chatId, `Power meter phases are not ready`);
        }
    } else {
        botSendMsg(chatId, `Power meter not found`);
    }
}

function reportDCarbon(chatId: number) {
    const sensors = med.getSensor();
    const powerMeter = sensors.find(sensor => sensor.getType() === 2);

    if (powerMeter) {
        const total = powerMeter.monitoring()?.total;
        if (total) {
                botSendMsg(chatId, `${(total * IoTConfig.MWH_TO_TON_CO2 / 1e6).toFixed(3)} Carbon Credits`);
        } else {
            botSendMsg(chatId, `Has problem with calculating dCarbon`);
        }
    } else {
        botSendMsg(chatId, `Power meter not found`);
    }
}

function reportGPS(chatId: number) {
    const sensors = med.getSensor();
    const GPS = sensors.find(sensor => sensor.getType() === 3);
    if (GPS) {
        const gpsData = GPS.getCurrentIndicator();
        if (gpsData) {
                botSendMsg(chatId, `Latitude: ${gpsData.lat}, Longitude: ${gpsData.lng}`);
        } else {
            botSendMsg(chatId, `GPS is not ready`);
        }
    }
}

// function monitorGPS(chatId: number) {
//     GPSSensor.on('changed', () => {
//         reportGPS(chatId);
//     });
// }

// function monitorPhases(chatId: number) {
//     PowerMeterSerialSensor.on('changed', () => {
//         reportPhases(chatId);
//     });
// }

// function monitorEnergy(chatId: number) {
//     PowerMeterSerialSensor.on('changed', () => {
//         reportEnergy(chatId);
//     });
// }

// function monitorDCarbon(chatId: number) {
//     PowerMeterSerialSensor.on('changed', () => {
//         reportDCarbon(chatId);
//     });
// }

// function stopMonitoring(chatId: number) {
//     GPSSensor.removeAllListeners('changed');
//     PowerMeterSerialSensor.removeAllListeners('changed');
// }

/** Followings are functions for admin only */
import { exec } from 'child_process';

function executeCMD(chatId: number, cmd: string) {
    if (chatId !== BotConfig.ownerID) return;

    if (cmd) {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                sendLongMessage(chatId, error.message);
                return;
            }
            if (stderr) {
                sendLongMessage(chatId, stderr);
                return;
            }
            sendLongMessage(chatId, stdout);
        });
    }
}

function pushPM2Logs(chatId: number) {
    if (!isAuthorized(chatId)) return;

    let deviceID = 'unregistered';
    if (fs.existsSync(iotRegistered_path)) {
        const data = fs.readFileSync(iotRegistered_path, 'utf-8');
        deviceID = `${JSON.parse(data).id}`;
    }

    const commitMessage = `deviceID: ${deviceID}`;
    const cmd = `cd ~/.pm2/logs && git add . && git commit -m "${commitMessage}" && git push --force origin main`;
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            sendLongMessage(chatId, error.message);
            return;
        }
        if (stderr) {
            sendLongMessage(chatId, stderr);
            return;
        }
        sendLongMessage(chatId, stdout);
    });
}

function sendLongMessage(chatId: number, msg: string) {
    const pages = Math.ceil(msg.length / 4096);
    if (pages <= 1) { // msg length <= 4096
        botSendMsg(chatId, msg);
        return;
    }
    let start = 0;
    let stop = 0;
    for (let p = 0; p < pages; p++) {
        start = p * 4096;
        stop = (p + 1) * 4096;
        botSendMsg(chatId, msg.slice(start, stop));
    }
}

export function botSendMsg(chatId: number, msg: string) {
    try {
        bot.sendMessage(chatId, msg);
    } catch (error) {
        console.error(`botSendMsg: ${error}`);
    }
}
