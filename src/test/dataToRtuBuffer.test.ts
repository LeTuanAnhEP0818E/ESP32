import dataToRtuBuffer from '../mock/dataToRtuBuffer'
import { extractRtuData, PMDATA } from '../extractRtuData';

describe('dataToRtuBuffer', () => {

    const input1: PMDATA = {
        rtu_address: 0x01,
        voltage: 220.0,
        current: 90.9,
        power: 210000.0,
        energy: 3567000,
        frequency: 50.0,
        power_factor: 0.98,
        alarm: false,
        error: null
    }


    const input2: PMDATA = {
        rtu_address: 0x02,
        voltage: 221.0,
        current: 80.1,
        power: 200000.0,
        energy: 13567000,
        frequency: 50.1,
        power_factor: 0.99,
        alarm: false,
        error: null
    }

    const input3: PMDATA = {
        rtu_address: 0x03,
        voltage: 222.1,
        current: 100.3,
        power: 200010.0,
        energy: 123567000,
        frequency: 48.9,
        power_factor: 0.99,
        alarm: true,
        error: null
    }

    const output1 = dataToRtuBuffer(input1);
    const output2 = dataToRtuBuffer(input2);
    const output3 = dataToRtuBuffer(input3);

    test('check output1 using extractRtuData fn', () => {
        expect(extractRtuData(output1)).toEqual(input1);
    });

    test('check output2 using extractRtuData fn', () => {
        expect(extractRtuData(output2)).toEqual(input2);
    });

    test('check output3 using extractRtuData fn', () => {
        expect(extractRtuData(output3)).toEqual(input3);
    });
});