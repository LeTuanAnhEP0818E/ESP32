import { program } from 'commander';
import { readAdress, changeAddress } from './pzemModules';
import { readEnergy, resetEnergy } from './pzemModules';
import { entryPrompt } from './resetProject';

program
    .command('resetProject <appDir>')
    .description('Reset and Reinitialize the device information: Telegram bot token, PM energies, Wallet Address ...\n' +
        'Please provide the path to the dCarbon app directory that contains configuration files.')
    .action(entryPrompt);

program
    .command('changeAddress <address>')
    .description('Change the address (in range of 0x01..0xf7) of a pzem module that is currently connected to AC line.')
    .action(changeAddress);

program
    .command('readAddress')
    .description('Read the address of an individual pzem module that is currently connected to AC line.')
    .action(readAdress);

program
    .command('readEnergy <address>')
    .description('Read the stored energy of a PZEM module with its address from 0x01 to 0xF7')
    .action(readEnergy);

program
    .command('resetEnergy <address>')
    .description('Reset the stored energy of a PZEM module with its address from 0x01 to 0xF7')
    .action(resetEnergy);

program.parse();