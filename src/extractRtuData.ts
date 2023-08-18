import { checkCRC } from './helpers';

export interface PMDATA {
    rtu_address: number;
    voltage: number;
    current: number;
    power: number;
    energy: number;
    frequency: number;
    power_factor: number;
    alarm: boolean;
    error: Error | null;
}

/**
 * Extract the registers' data from a Modbus RTU reply message
 *
 * @param {Buffer} rtuRxBuffer A buffer of binary of hex string that returns from a rtuRequest's callback.
 * @returns {Object} An object with extracted register values.
 */
export function extractRtuData(rtuRxBuffer: Buffer): PMDATA {
    const output: PMDATA = {
        rtu_address: 0x00,
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0,
        frequency: 0,
        power_factor: 0,
        alarm: false,
        error: null,
    };

    // Perform CRC check of the input message
    if (!checkCRC(rtuRxBuffer)) {
        output.error = new Error('CRC check fail');
        return output;
    }

    output.rtu_address = rtuRxBuffer.readUInt8(0);
    
    const functionCode = rtuRxBuffer.readUInt8(1);
    if (functionCode !== 0x04) {
        const errorCode = rtuRxBuffer.readUInt8(2);
        output.error = new Error(`Error Response from device, code: ${errorCode}`);
        return output;
    }

    if (rtuRxBuffer.length !== 25) {
        output.error = new Error('RX message length must be 25 bytes');
        return output;
    }

    const numOfRegisters = rtuRxBuffer.readUInt8(2) / 2;
    if (numOfRegisters !== 10) {
        output.error = new Error('Number of intput registers must be 10');
        return output;
    }

    // Extract the corresponding values from rtuRxBuffer
    output.voltage = rtuRxBuffer.readUInt16BE(3) / 10; // register 0x00 with 1LSB corresponds to 0.1V

    const currentLowBits = rtuRxBuffer.readUInt16BE(5); // register 0x01 with 1LSB corresponds to 0.001A
    const currentHighBits = rtuRxBuffer.readUInt16BE(7); // register 0x02 with 1LSB corresponds to 0.001A
    output.current = ((currentHighBits << 16) | currentLowBits) / 1000;

    const powerLowBits = rtuRxBuffer.readUInt16BE(9); // register 0x03 with 1LSB corresponds to 0.1W
    const powerHighBits = rtuRxBuffer.readUInt16BE(11); // register 0x04 with 1LSB corresponds to 0.1W
    output.power = ((powerHighBits << 16) | powerLowBits) / 10;

    const energyLowBits = rtuRxBuffer.readUInt16BE(13); // register 0x05 with 1LSB corresponds to 1Wh
    const energyHighBits = rtuRxBuffer.readUInt16BE(15); // register 0x06 with 1LSB corresponds to 1Wh
    output.energy = ((energyHighBits << 16) | energyLowBits);

    output.frequency = rtuRxBuffer.readUInt16BE(17) / 10; // register 0x07 with 1LSB corresponds to 0.1Hz
    output.power_factor = rtuRxBuffer.readUInt16BE(19) / 100; // register 0x08 with 1LSB corresponds to 0.01

    const alarmValue = rtuRxBuffer.readUInt16BE(21);
    output.alarm = (alarmValue === 0xFFFF); // register 0x09 with 0xFFFF is alarm, 0x0000 is not alarm

    return output;
}

// const mockRtuRxMessage = Buffer.from('010414089803e80000089800000000000001f40064000063ce', 'hex');
// console.log(extractRtuData(mockRtuRxMessage));
// /*
// {
//   voltage: 220,
//   current: 1,
//   power: 220,
//   energy: 0,
//   frequency: 50,
//   power_factor: 1,
//   alarm: false,
//   error: null
// }
// */
// const mockRtuRxMessage2 = Buffer.from('f8041208bd00000000000000000002000001f400003a8b', 'hex');
// console.log(extractRtuData(mockRtuRxMessage2));
// /*
// {
//   voltage: 223.7,
//   current: 0,
//   power: 0,
//   energy: 2,
//   frequency: 50,
//   power_factor: 0,
//   alarm: false,
//   error: null
// }
// */

// const mockBadRtuRxMessage = Buffer.from('f8041208bd00000000000000000002000001f400003a8b', 'hex');
// console.log(extractRtuData(mockBadRtuRxMessage));