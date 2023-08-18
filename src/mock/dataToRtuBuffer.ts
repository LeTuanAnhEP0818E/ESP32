import { crc16modbus } from '../helpers';

interface Data {
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
 * Transform an object of register values to a Modbus RTU reply message
 *
 * @param {Object} data An object with register values
 * @returns {Buffer} A buffer of binary data in Modbus RTU format
 */
function dataToRtuBuffer(data: Data): Buffer {
    const buf = Buffer.alloc(25);

    // The first 3 bytes 
    buf.writeUInt8(data.rtu_address, 0); // RTU address
    buf.writeUInt8(0x04, 1); // Function code (0x04) is fixed
    buf.writeUInt8(0x14, 2); // Number of bytes in the message (0x14 = 20) is fixed

    // Write register values to the buffer
    buf.writeUInt16BE(data.voltage * 10, 3);    // 1LSB corresponds to 0.1V

    // ... current to 0x01, 0x02
    let value = data.current * 1000 // 1LSB corresponds to 0.001A
    let low_bits = value & 0xFFFF;
    let high_bits = (value >> 16) & 0xFFFF;
    buf.writeUInt16BE(low_bits, 5);
    buf.writeUInt16BE(high_bits, 7);

    // ... power to 0x03, 0x04
    value = data.power * 10 // 1LSB corresponds to 0.1W
    low_bits = value & 0xFFFF;
    high_bits = (value >> 16) & 0xFFFF;
    buf.writeUInt16BE(low_bits, 9);
    buf.writeUInt16BE(high_bits, 11);

    // ... power to 0x05, 0x06
    value = data.energy     // 1LSB corresponds to 1Wh
    low_bits = value & 0xFFFF;
    high_bits = (value >> 16) & 0xFFFF;
    buf.writeUInt16BE(low_bits, 13);
    buf.writeUInt16BE(high_bits, 15);

    buf.writeUInt16BE(data.frequency * 10, 17); // 1LSB corresponds to 0.1Hz (register 0x07)
    buf.writeUInt16BE(data.power_factor * 100, 19);         // Register 0x08 with 1LSB corresponds to 0.01
    buf.writeUInt16BE(data.alarm ? 0xFFFF : 0x0000, 21);    // Register 0x09 with 0xFFFF is alarm, 0x0000 is not alarm

    // Calculate and write CRC to the last 2 bytes of the buffer
    buf.writeUInt16BE(crc16modbus(buf.subarray(0, buf.length - 2)), 23);

    return buf;
}

export default dataToRtuBuffer;
