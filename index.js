/**
 * Why did they do it?!?
 */
const Discord = require('discord.js');
const { token } = require('./config.json');

const commandListener = require('./listeners/command.js');
const memberPresenceListener = require('./listeners/memberPresence.js');

const client = new Discord.Client();

client.on('ready', () => {
    commandListener.init(client);
    memberPresenceListener.init(client);
    console.log('Ready!');
});

client.login(token);