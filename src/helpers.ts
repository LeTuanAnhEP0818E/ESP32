import * as ethUtil from 'ethereumjs-util';

function splitSignature(signature: string) {
    // signature: "0x(65bytes)" --> {r, s, v} = {"0x(32bytes)", "0x32bytes", "0x1byte"}
    return {
        r: "0x" + signature.slice(2, 66),
        s: "0x" + signature.slice(66, 130),
        v: "0x" + signature.slice(130, signature.length),
    };
}

function numberToHexStr(number: number) {
    // convert number to hex string, padding with zeros
    return ethUtil.bufferToHex(ethUtil.intToBuffer(number));
}

function checkCRC(buffer: Buffer) {
    return crc16modbus(buffer) === 0;
}

// helper function to calculate the CRC
function crc16modbus(buffer: Buffer) {
    let crc = 0xffff;
    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc >>= 1;
                crc ^= 0xa001;
            } else {
                crc >>= 1;
            }
        }
    }
    return ((crc & 0xff) << 8) | (crc >> 8);
    // return crc;
}

// const TX = "f804000000092465" // CRC = 2465
// const RX = "01041408fd00000000000000000002000001fd00000000fd54"; // CRC = 63ce
// console.log(crc16modbus(Buffer.from(TX, 'hex')).toString(16)); // --> 0 --> CRC correct!
// console.log(crc16modbus(Buffer.from(RX, 'hex')).toString(16)); // --> 0 --> CRC correct!
// console.log(crc16modbus(Buffer.from("01041408e700000000000000000002000001f3000000006ace", 'hex')).toString(16)); // --> 6464 --> CRC correct!
// console.log(crc16modbus(Buffer.from("02041408ef00000000000000000002000001f400000000698a", 'hex')).toString(16)); // --> 6464 --> CRC correct!
// console.log(crc16modbus(Buffer.from("03041408ed00000000000000000002000001f500000000e06e", 'hex')).toString(16)); // --> 6464 --> CRC correct!
// console.log(crc16modbus(Buffer.from("02040000000a703e", 'hex')).toString(16)); // --> 6464 --> CRC correct!
// console.log(crc16modbus(Buffer.from("f80600020002bda2", 'hex')).toString(16)); // The command to change the slave address to 0x02
// console.log(crc16modbus(Buffer.from("f806000200037c62", 'hex')).toString(16)); // The command to change the slave address to 0x03

// console.log(crc16modbus(Buffer.from("01040000000a700d", 'hex')).toString(16)); // Query command to the slave address 0x01
// console.log(crc16modbus(Buffer.from("02040000000a703e", 'hex')).toString(16)); // Query command to the slave address 0x02
// console.log(crc16modbus(Buffer.from("03040000000a71ef", 'hex')).toString(16)); // Query command to the slave address 0x03

export { splitSignature, numberToHexStr, checkCRC, crc16modbus };
