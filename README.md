Source code for IoT devices running on Raspberry Pi Zero W boards

## Problem with ssh over wifi:

- When both usb0 (4G) and wlan (wifi) --> ssh some time stuck (drop and cannot connect)
-

The `ip route` command in my Pi shows:

```bash
default via 192.168.225.1 dev usb0 proto dhcp src 192.168.225.39 metric 203 mtu 1500
default via 10.130.0.1 dev wlan0 proto dhcp src 10.130.0.64 metric 302
10.130.0.0/24 dev wlan0 proto dhcp scope link src 10.130.0.64 metric 302
192.168.225.0/24 dev usb0 proto dhcp scope link src 192.168.225.39 metric 203 mtu 1500
```

how to temporarily off the usb0

You can temporarily turn off the usb0 interface by using the following command:

`sudo ifconfig usb0 down`
This will bring down the usb0 interface and disable its network connectivity. Note that this change is temporary and will revert back to its original state after a system reboot or if the interface is brought back up manually. To bring the interface back up, use the following command:

`sudo ifconfig usb0 up`
This will enable the usb0 interface and restore its network connectivity.

## The AT command for GPS long lat

// const gpsResponse = "+CGPSINFO: 2101.463987,N,10550.561510,E,250423,065726.0,23.1,0.0,";

Function signature: GPS.extractGPS(gpsResponse: string):{
finalLatitude: number;
finalLongitude: number;
} | undefined
Input string structure: +CGPSINFO:[<lat>],[<N/S>],[<log>],[<E/W>],[<date>],[<UTCtime>],[<alt>],[<speed>],[<course>]
Detail information of the input string structure:
<lat> Latitude of current position. Output format is ddmm.mmmmmm
<N/S> N/S Indicator, N=north or S=south
<log> Longitude of current position. Output format is dddmm.mmmmmm
<E/W> E/W Indicator, E=east or W=west
<date> Date. Output format is ddmmyy
<UTC time> UTC Time. Output format is hhmmss.s
<alt> MSL Altitude. Unit is meters.
<speed> Speed Over Ground. Unit is knots.
<course> Course. Degrees.
<time> The range is 0-255, unit is second, after set <time> will report theGPSinformation every the seconds.
Example of a input string:
const gpsResponse = "+CGPSINFO: 2101.463987,N,10550.561510,E,250423,065726.0,23.1,0.0,";
Expected output: a object of {finalLatitude: float_number, finalLongitude: float_number}

Execution Command
AT+CGPSINFO
Response
+CGPSINFO:[<lat>],[<N/S>],[<log>],[<E/W>],[<date>],[<UTCtime>],[<alt>],[<speed>],[<course>]

<lat> Latitude of current position. Output format is ddmm.mmmmmm
<N/S> N/S Indicator, N=north or S=south
<log> Longitude of current position. Output format is dddmm.mmmmmm
<E/W> E/W Indicator, E=east or W=west
<date> Date. Output format is ddmmyy
<UTC time> UTC Time. Output format is hhmmss.s
<alt> MSL Altitude. Unit is meters.
<speed> Speed Over Ground. Unit is knots.
<course> Course. Degrees.
<time> The range is 0-255, unit is second, after set <time> will report theGPSinformation every the seconds.

---

# Get nonce from a smart contract

- Let's say I've deployed a smart contract name `ERC20Minter.sol` that has a function name `getNone` as following:

```solidity
    function getNonce(
        address deviceAddr
    ) public view virtual override returns (uint256) {
        IOTDevice storage device = _devices[deviceAddr];
        return device.nonce.current();
    }
```

- I've deployed that smart contract on a ganache with the provider URL of "https://my.domain.org/ganache"
- My Question is: How to get nonce from the above solidity smart contract using ethers.js?

- So, let's say I have the following prameters as input:

```
const rpcURL = 'https://my.domain.org/ganache';
const contractAddress = 'CONTRACT_ADDRESS';
```

- Write the JS code to calculate the `const functionSignature = ...` based on the getNonce(address deviceAddr) function signature.

- Then write the JS code using axios to call that contract function and console.log the received result.

```JavaScript
const { ethers } = require('ethers');

const rpcURL = 'https://my.domain.org/ganache';
const contractAddress = 'CONTRACT_ADDRESS';

async function callContractFunction() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcURL);
    const contract = new ethers.Contract(contractAddress, [], provider);

    const contractABI = await contract.interface.format('json');
    console.log('Contract ABI:', contractABI);

    const deviceAddress = 'DEVICE_ADDRESS'; // Replace with the actual device address
    const nonce = await contract.getNonce(deviceAddress);

    console.log('Nonce:', nonce.toString());
  } catch (error) {
    console.error('Error:', error);
  }
}

callContractFunction();
```

npx hardhat compile
