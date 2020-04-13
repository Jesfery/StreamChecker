require('dotenv').config();

const Discord = require('discord.js');

const commandListener = require('./listeners/command.js');
const memberPresenceListener = require('./listeners/memberPresence.js');

const client = new Discord.Client();
const initialised = [];

client.once('ready', () => {
    //I suspect this event is happening more than once.
    // Below is added as a safeguard.
    if (initialised.length > 0) {
        return;
    }
    initialised.push(true);

    commandListener.init(client);
    memberPresenceListener.init(client);
    console.log('Ready at ' + new Date());
});

client.login(process.env.DISCORD_TOKEN);