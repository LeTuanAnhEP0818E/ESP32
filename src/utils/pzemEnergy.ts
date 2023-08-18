/**
 * This is a cli tool and helper function to reset energy in a PZEM module that is connected to AC line
 * Commands:
 * - `node pzemEnergy reset <address>`: reset the energy value stored in a specific PZEM module with its <address>.
 * - `node pzemEnergy read <address>`: read the energy value stored in a specific PZEM module with its <address>.
 */

import { checkCRC, crc16modbus } from '../helpers';
import { port } from './pzemModules';
import { promisify } from 'node:util'
import chalk from 'chalk';



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

let COMMAND = 'reset';

function interpret(data: any): void {
    switch (COMMAND) {
        case 'reset':
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
        case 'read':
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

export async function resetEnergy(address: string) {
    COMMAND = 'reset';
    await sendRequest(resetEnergyRtuBuffer(parseInt(address)));
}

export async function readEnergy(address: string) {
    COMMAND = 'read';
    await sendRequest(readEnergyRtuBuffer(parseInt(address)));
}

function extractRtuEnergy(data: Buffer): number {
    const energyLowBits = data.readUInt16BE(3); // register 0x05 with 1LSB corresponds to 1Wh
    const energyHighBits = data.readUInt16BE(5); // register 0x06 with 1LSB corresponds to 1Wh
    return ((energyHighBits << 16) | energyLowBits);
}
