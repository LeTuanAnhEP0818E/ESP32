/**
 * Cli tool to reset PZEM modules' address and energy. Require: PZEM modules must be connected to AC line.
 * - `pzemAddress read`: read the address of an individual pzem module that is currently connected to AC line.
 * - `pzemAddress scan`: scan addresses of all the pzem modules that are connected to AC line.
 * - `pzemAddress change <0x01..0xf7>`: change the address of a pzem module that is currently connected to AC line.
 * - `node pzemEnergy reset <address>`: reset the energy value stored in a specific PZEM module with its <address>.
 * - `node pzemEnergy read <address>`: read the energy value stored in a specific PZEM module with its <address>.
 */

import { checkCRC, crc16modbus } from '../helpers';
import { SerialPort } from 'serialport';
import { PMConfig } from '../env';
import { promisify } from 'node:util'
import chalk from 'chalk';

// sendRequest('f806000200037c62'); // Change address to 0x03
function changeRtuAddressBuffer(address: number): Buffer {
    const buf = Buffer.alloc(8);
    buf.writeUint8(0xF8, 0); // The general address of all PZEM module
    buf.writeUInt8(0x06, 1); // Function code to modify PZEM parameters
    buf.writeUInt8(0x00, 2); // RTU Address Register Address High Byte
    buf.writeUInt8(0x02, 3); // RTU Address Register Address Low Byte
    buf.writeUInt8(0x00, 4); // Register Value High Byte
    buf.writeUInt8(address, 5); // Register Value Low Byte

    buf.writeUInt16BE(crc16modbus(buf.subarray(0, 6)), 6);

    return buf;
}

function readRtuAdressBuffer(address: number = 0xF8): Buffer {
    const buf = Buffer.alloc(8);
    buf.writeUint8(address, 0);
    buf.writeUInt8(0x03, 1); // Function code for read PZEM measurement
    buf.writeUInt8(0x00, 2); // RTU Address Register Address High Byte
    buf.writeUInt8(0x02, 3); // RTU Address Register Address Low Byte
    buf.writeUInt8(0x00, 4); // Number of Registers High Byte
    buf.writeUInt8(0x01, 5); // Number of Registers Low Byte

    buf.writeUInt16BE(crc16modbus(buf.subarray(0, 6)), 6);

    return buf;
}

function resetEnergyRtuBuffer(address: number): Buffer {
    const buf = Buffer.alloc(4);
    buf.writeUint8(address, 0);
    buf.writeUInt8(0x42, 1); // Function code for reset PZEM energy
    buf.writeUInt16BE(crc16modbus(buf.subarray(0, 2)), 2);

    return buf;
}

function readEnergyRtuBuffer(address: number): Buffer {
    const buf = Buffer.alloc(8);
    buf.writeUint8(address, 0);
    buf.writeUInt8(0x04, 1); // Function code for read PZEM measurement
    buf.writeUInt8(0x00, 2); // Energy Register Address High Byte
    buf.writeUInt8(0x05, 3); // Energy Register Address Low Byte
    buf.writeUInt8(0x00, 4); // Number of Registers High Byte
    buf.writeUInt8(0x02, 5); // Number of Registers Low Byte

    buf.writeUInt16BE(crc16modbus(buf.subarray(0, 6)), 6);

    return buf;
}

// Create a port
export const port = new SerialPort({
    path: PMConfig.port,
    // path: 'COM10',
    baudRate: 9600,
});
// Open errors will be emitted as an error event
port.on('error', function (err) {
    console.log('Error: ', err.message)
})

async function sendRequest(rtuBuffer: Buffer) {
    port.write(rtuBuffer, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('Sent Command:', rtuBuffer.toString('hex'));
    });
    await new Promise(resolve => setTimeout(resolve, 100)); // wait for 100 ms
}

function readAfter(milliseconds: number, callback: (arg0: null, arg1: any) => void) {
    setTimeout(() => {
        const data = port.read();
        if (!data) {
            // callback(new Error(`Received data: ${data}`)); // maybe null
        } else {
            callback(null, data);
        }
    }, milliseconds);
}

const readAfterPromise = promisify(readAfter);

port.on('readable', async function () {
    try {
        const data = await readAfterPromise(50);
        interpret(data);
    } catch (err) {
        console.error(err)
    }
});

let COMMAND = '';

function interpret(data: any): void {
    switch (COMMAND) {
        case 'change address':
            if (checkCRC(data) && data[1] === 0x06) {
                console.log(
                    chalk.green.bold('DONE')
                )
            } else {
                console.log(
                    chalk.red.bold('Change RTU Address Fail')
                );
                console.log('PZEM Response:', data.toString('hex'));
                if (!checkCRC(data)) console.log("CRC false");
            }
            break;
        case 'read address':
            if (checkCRC(data) && data[1] === 0x03) {
                console.log(`RTU Adress: 0x${chalk.green.bold(extractRtuAddress(data))}`);
            } else {
                console.log(
                    chalk.red.bold('Read RTU Address Fail')
                );
                console.log('PZEM Response:', data.toString('hex'));
                if (!checkCRC(data)) console.log("CRC false");
            }
            break;
        case 'reset energy':
            if (checkCRC(data) && data[1] === 0x42) {
                console.log(
                    chalk.green.bold('DONE')
                )
            } else {
                console.log(
                    chalk.red.bold('Reset Energy Fail')
                );
                console.log('PZEM Response:', data.toString('hex'));
                if (!checkCRC(data)) console.log("CRC false");
            }
            break;
        case 'read energy':
            if (checkCRC(data) && data[1] === 0x04) {
                console.log(`Energy: ${chalk.green.bold(extractRtuEnergy(data))} Wh`);
            } else {
                console.log(
                    chalk.red.bold('Read Energy Fail')
                );
                console.log('PZEM Response:', data.toString('hex'));
                if (!checkCRC(data)) console.log("CRC false");
            }
            break;
        default:
            break;
    }
}

export async function readAdress() {
    COMMAND = 'read address';
    await sendRequest(readRtuAdressBuffer());
}

export async function changeAddress(address: string) {
    COMMAND = 'change address';
    await sendRequest(changeRtuAddressBuffer(parseInt(address)));
}

function extractRtuAddress(data: Buffer): string {
    const address = data.readUInt16BE(3); // register 0x0002 hold the Modbus-RTU address
    return address.toString(16);
}

export async function resetEnergy(address: string) {
    COMMAND = 'reset energy';
    await sendRequest(resetEnergyRtuBuffer(parseInt(address)));
}

export async function readEnergy(address: string) {
    COMMAND = 'read energy';
    await sendRequest(readEnergyRtuBuffer(parseInt(address)));
}

function extractRtuEnergy(data: Buffer): number {
    const energyLowBits = data.readUInt16BE(3); // register 0x05 with 1LSB corresponds to 1Wh
    const energyHighBits = data.readUInt16BE(5); // register 0x06 with 1LSB corresponds to 1Wh
    return ((energyHighBits << 16) | energyLowBits);
}
