import { extractRtuData, PMDATA } from '../extractRtuData';

describe('extractRtuData', () => {

    test('should extract all fields correctly from the rtuRxMessage', () => {
        const mockRtuRxMessage = Buffer.from('010414089803e80000089800000000000001f40064000063ce', 'hex');
        const expected: PMDATA = {
            rtu_address: 0x01,
            voltage: 220.0,
            current: 1.0,
            power: 220.0,
            energy: 0,
            frequency: 50.0,
            power_factor: 1.0,
            alarm: false,
            error: null
        };

        expect(extractRtuData(mockRtuRxMessage)).toEqual(expected);
    });

    test('should extract all fields correctly from another rtuRxMessage', () => {
        const mockRtuRxMessage = Buffer.from('f8041408a600000000000000000002000001f300000000e387', 'hex');
        const expected: PMDATA = {
            rtu_address: 0xf8,
            voltage: 221.4,
            current: 0,
            power: 0,
            energy: 2,
            frequency: 49.9,
            power_factor: 0,
            alarm: false,
            error: null
        };

        expect(extractRtuData(mockRtuRxMessage)).toEqual(expected);
    });

    test('should handle number of input registers different from 10', () => {
        const mockRtuRxMessage = Buffer.from('f8041208bd00000000000000000002000001f400003a8b', 'hex');
        const expected: PMDATA = {
            rtu_address: 0xf8,
            voltage: 0,
            current: 0,
            power: 0,
            energy: 0,
            frequency: 0,
            power_factor: 0,
            alarm: false,
            error: new Error('RX message length must be 25 bytes')
        };

        expect(extractRtuData(mockRtuRxMessage)).toEqual(expected);
    });

    test('should handle CRC check failure', () => {
        const mockBadRtuRxMessage = Buffer.from('f8041208bd00000000000000000002000001f400003a8a', 'hex');
        const result = extractRtuData(mockBadRtuRxMessage);
        expect(result).toEqual({
            rtu_address: 0x00,
            voltage: 0,
            current: 0,
            power: 0,
            energy: 0,
            frequency: 0,
            power_factor: 0,
            alarm: false,
            error: new Error('CRC check fail')
        });
    });
});
