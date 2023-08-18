/**
 * Cli tool to reset dCarbon IoT device. It will reset the following project's parameters:
 * Warning: This command will permanently delete this device address
 * 
 * This tool will:
 * 
 * - Ask for a new unique project name 
 * - Generate new wallet address and pk
 * - Clear all existing dCarbon Credits associated with this device
 * - Clear all measured power energy (Wh) and Reset all the three power meter to Zero Wh.
 * - Ask for a new Telegram Bot Token for this device
 * - Register this IoT device to the dCarbon Server (with the API's JWT token in env.js) 
 * - Register this device's sensors (GPS and Power Meters) to the dCarbon Server
 * - Change the sensor's status in the dCarbon Server
 * 
 * Order of commands:
 * 
 * - ? Config a New Telegram Bot (y/N)
 * - ? Reset energy values stored in this device (y/N)
 * - ? Reset Power Meter(s) (y/N)
 * - ? Initialize a new project (y/N)
 * - ? Register this device to dCarbon Server (y/N)
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

import chalk from 'chalk';
import inquirer from 'inquirer';

import { generateNewAddress } from '../wallet';
import { resetEnergy } from './pzemModules';
import { IoTConfig } from '../env';
import { port } from './pzemModules';

/** The entry prompt
 * 
 * @param {string} appDir - the app directory path to read/write status/*.json file
 */
export async function entryPrompt(appDir: string = '../') {
    await resetTelegram(appDir);
    await resetEnergyPrompt(appDir);
    await resetInfo(appDir);
    await registerDevice(appDir);
    port.close();
}

async function resetTelegram(appDir: string) {
    const configDir = path.join(appDir, 'config')
    const telegramFilePath = path.join(configDir, 'telegram.config.json');
    let telegramPrompt = {
        type: 'confirm',
        name: 'confirm',
        message: `Config a New Telegram Bot`
    }
    if (fs.existsSync(telegramFilePath)) {
        const data = fs.readFileSync(telegramFilePath, 'utf-8');
        telegramPrompt.message += `\nFound ${telegramFilePath} with content:\n${data}\n\nAre you sure to overwrite this?`;
    }

    let answers = await inquirer.prompt([telegramPrompt]);
    if (answers.confirm) {
        answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'token',
                message: 'Enter new Telegram Bot Token:',
                validate: (value) => {
                    if (!value) {
                        return 'Please enter a telegram bot token';
                    }
                    return true;
                }
            }
        ]);
        const data = {
            token: answers.token
        };
        fs.writeFileSync(telegramFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(chalk.green('The new bot token has beed stored.'));
        console.log(`You can edit advanced Bot's options at <appDir>/env.js`);
    }
}

async function resetEnergyPrompt(appDir: string) {
    const statusDir = path.join(appDir, 'status');
    const energyPath = path.join(statusDir, 'energy.log');
    if (!fs.existsSync(statusDir)) {
        fs.mkdirSync(statusDir);
    }

    let energyPrompt = {
        type: 'confirm',
        name: 'confirm',
        message: 'Reset energy values stored in this device'
    }
    if (fs.existsSync(energyPath)) {
        const data = fs.readFileSync(energyPath, 'utf-8');
        energyPrompt.message += `\nFound ${energyPath} with content:\n${data}\n\nAre you sure to overwrite this?`;
    }

    let answers = await inquirer.prompt([energyPrompt]);

    if (answers.confirm) {
        try {
            const values = `0,0,0,0\n`;
            fs.writeFileSync(energyPath, values, { flag: 'w' });
        } catch (err) {
            console.error(`${err}`);
        }
        console.log(
            chalk.green('The energies stored in this device has been reset to (0,0,0,0).'),
        );
    }
    for (let i = 1; i <= 3; i++) {
        answers = await resetPowerMeterPrompt(i);
        if (answers.confirm) {
            await resetEnergy(`0x0${i}`);
        }
    }
}

async function resetPowerMeterPrompt(index: number) {
    return inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Reset Power Meter 0x0${index}'s energy. Please connect that device to AC power line before proceeding!`
        }
    ]);
}

async function resetInfo(appDir: string) {
    const configDir = path.join(appDir, 'config')
    const infoFilePath = path.join(configDir, 'project.info.json');

    let firstPrompt = {
        type: 'confirm',
        name: 'confirm',
        message: 'Initialize a new project'
    }
    if (fs.existsSync(infoFilePath)) {
        const data = fs.readFileSync(infoFilePath, 'utf-8');
        firstPrompt.message += `\nFound ${infoFilePath} with content:\n${data}\n\nAre you sure to overwrite this?`;
    }

    let answers = await inquirer.prompt([firstPrompt]);
    if (answers.confirm) {
        answers = await inquirer.prompt(
            [
                {
                    type: 'input',
                    name: 'description',
                    message: 'Enter a short description of new project:',
                    validate: (value) => {
                        if (!value) {
                            return 'Please enter a project description';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'latitude',
                    message: 'Enter the project location\'s latitude:',
                    validate: (value) => {
                        if (isNaN(value)) {
                            return 'Please enter a valid number';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'longitude',
                    message: 'Enter the project location\'s longitude:',
                    validate: (value) => {
                        if (isNaN(value)) {
                            return 'Please enter a valid number';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'longitude',
                    message: 'Enter the project location\'s longitude:',
                    validate: (value) => {
                        if (isNaN(value)) {
                            return 'Please enter a valid number';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'project',
                    message: 'Enter the project id received when creating project:',
                    validate: (value) => {
                        if (isNaN(value)) {
                            return 'Please enter a valid number';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'type',
                    message: 'Enter the project type according to the given enum:',
                    validate: (value) => {
                        if (isNaN(value)) {
                            return 'Please enter a valid number';
                        }
                        return true;
                    }
                },
            ]);

        const walletAddress = generateNewAddress();
        console.log(chalk.green(`New wallet address: ${walletAddress}`))

        const data = {
            description: answers.description,
            address: walletAddress,
            "position": {
                "lat": parseFloat(answers.latitude),
                "lng": parseFloat(answers.longitude)
            },
            "project": parseInt(answers.project),
            "type": parseInt(answers.type)
        };
        fs.writeFileSync(infoFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(
            chalk.green('The new device information was stored')
        );
    }
}

async function registerDevice(appDir: string) {
    const configDir = path.join(appDir, 'config')
    const infoFilePath = path.join(configDir, 'project.info.json');
    if (!fs.existsSync(infoFilePath)) {
        console.log(`${infoFilePath} not found. Please initialize your project info first!`);
        return;
    }

    const data = fs.readFileSync(infoFilePath, 'utf-8');
    const infoObj = JSON.parse(data);

    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Register this device to dCarbon Server. Make sure the device is connected to the internet before continuing!`
        }
    ]);

    if (answers.confirm) {
        // Check if the device hasn't registered then register
        let iotID = await registerIoT(appDir, infoObj);
        // Check if the GPS sensor hasn't registered then register
        let sensorsID = await registerSensors(appDir, iotID, infoObj.address);
        // change the sensor's status
        let statusChanged = await changeSensorsStatus(appDir, sensorsID);
        if (statusChanged) {
            console.log(
                chalk.green('Device registered successfully!')
            );
        } else {
            console.log(
                chalk.red('Fail to register device and/or sensors')
            );
        }
        console.log(`iotID: ${iotID}, sensorID: ${sensorsID}, statusChanged: ${statusChanged}`)
        console.log(`Browse <appDir>/status/*.* for more details`);
    }
}

//----- Server Registering Functions: -----//
interface DEVICE_INFO {
    id: number | undefined;
    address: string;
    position: {
        lat: number;
        lng: number;
    },
    "project": number;
}

/* `registered.json`? --> Register IoT device if doen't exists */
async function registerIoT(appDir: string, infoObj: DEVICE_INFO): Promise<number | undefined> {
    const statusDir = path.join(appDir, 'status');
    const registeredFilePath = path.join(statusDir, 'registered.json');

    if (fs.existsSync(registeredFilePath)) {
        const data = fs.readFileSync(registeredFilePath, 'utf-8');
        const registerObj = JSON.parse(data);
        if (registerObj.address === infoObj.address) {
            return registerObj.id;
        }
    }

    const baseURL = IoTConfig.baseURL;
    const jwtToken = IoTConfig.jwtToken;
    const config = {
        headers: { Authorization: `Bearer ${jwtToken}` }
    };

    try {
        const response = await axios.post(baseURL + '/iots/', infoObj, config);
        infoObj.id = response.data.id;
        fs.writeFileSync(registeredFilePath, JSON.stringify(response.data, null, 2), 'utf-8');
        return infoObj.id;
    } catch (error) {
        console.error(`POST /iots/ to create: ${error}`);
        if (axios.isAxiosError(error)) {
            console.error(error.response?.data);
        }
        return undefined;
    }
}

interface SENSORS_INFO {
    address: string;
    iotId: number;
    type: number;
}

async function registerSensors(appDir: string, iotID: number | undefined, walletAddress: string) {
    if (!iotID) return undefined;

    const statusDir = path.join(appDir, 'status');
    const sensorsRegisteredFilePath = path.join(statusDir, 'sensorsRegistered.json');

    if (fs.existsSync(sensorsRegisteredFilePath)) {
        const data = fs.readFileSync(sensorsRegisteredFilePath, 'utf-8');
        const registerObj = JSON.parse(data);
        if (registerObj.address === walletAddress) {
            return registerObj.id;
        }
    }

    let gpsInfo: SENSORS_INFO = {
        "address": walletAddress,
        iotId: iotID,
        type: 1
    }
    const baseURL = IoTConfig.baseURL;
    const jwtToken = IoTConfig.jwtToken;
    const config = {
        headers: { Authorization: `Bearer ${jwtToken}` }
    };

    let gpsID: number | undefined = undefined;
    try {
        const response = await axios.post(baseURL + '/sensors/', gpsInfo, config);
        gpsID = response.data.id;
        fs.writeFileSync(sensorsRegisteredFilePath, JSON.stringify(response.data, null, 2), 'utf-8');
        return gpsID;
    } catch (error) {
        console.error(`POST /sensors/ to create: ${error}`);
        if (axios.isAxiosError(error)) {
            console.error(error.response?.data);
        }
        return gpsID;
    }
}

async function changeSensorsStatus(appDir: string, sensorId: number | undefined): Promise<boolean> {
    if (!sensorId) return false;

    const statusDir = path.join(appDir, 'status');
    const sensorsStatusFilePath = path.join(statusDir, 'sensorsStatus.json');

    if (fs.existsSync(sensorsStatusFilePath)) {
        const data = fs.readFileSync(sensorsStatusFilePath, 'utf-8');
        const registerObj = JSON.parse(data);
        if (registerObj.id === sensorId && registerObj.status === 10) {
            return true;
        }
    }

    const payload = {
        "id": sensorId,
        "status": 10
    }
    const baseURL = IoTConfig.baseURL;
    const jwtToken = IoTConfig.jwtToken;
    const config = {
        headers: { Authorization: `Bearer ${jwtToken}` }
    };
    try {
        const response = await axios.put(baseURL + '/sensors/change-status', payload, config);
        fs.writeFileSync(sensorsStatusFilePath, JSON.stringify(response.data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`POST /sensors/change-status: ${error}`);
        if (axios.isAxiosError(error)) {
            console.error(error.response?.data);
        }
        return false;
    }
}