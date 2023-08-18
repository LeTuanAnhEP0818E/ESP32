import { ethers } from "ethers";
import { SMConfig } from '../env';

const rpcURL = SMConfig.ProviderURL;
const contractAddress = SMConfig.verifyingContract;
const deviceAddress = '0x127a0c55dac2147e928fd43d769317ed60c35897';

async function callContractFunction() {
    try {
        const provider = new ethers.JsonRpcProvider(rpcURL);
        const contract = new ethers.Contract(contractAddress, [], provider);

        const contractABI = contract.interface.formatJson();
        console.log(`Contract ABI: ${contractABI}`);

        const nonce = await contract.getNonce(deviceAddress);

        console.log(`Nonce: ${nonce}`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

callContractFunction();