const utils = require('../utils.js');
const Discord = require('discord.js');
const cooldowns = new Discord.Collection();
const cooldownAmount = 4 * 60 * 60 * 1000; //4 hours. May make this configurable in the future.

function checkStreaming(oldPresence, newPresence) {
    let newMember = newPresence.member;

    if (!newMember) {
        return;
    }

    let guild = newMember.guild,
        newActivityType = utils.get(newPresence, 'activity.type'),
        oldActivityType = utils.get(oldPresence, 'activity.type'),
        promise;

    if (!guild.streamingRole) {
        guild.streamingRole = guild.roles.find(role => role.name === 'now-streaming');
        if (!guild.streamingRole) {
            console.log(`${guild.name} - now-streaming role not found`);
            return;
        }
    }

    let streamingChannel = guild.channels.find(channel => {
        return channel.name === 'now-streaming' && channel.type === 'text';
    });

    if (!streamingChannel) {
        console.log(`${guild.name} - now-streaming channel not found`);
        return;
    }

    if (newActivityType === 'STREAMING') {
        promise = newMember.roles.add(guild.streamingRole);
    } else {
        promise = newMember.roles.remove(guild.streamingRole);
    }

    function afterRoleChange() {    
        let streamingMembersUrl = [];
        guild.streamingRole.members.forEach(member => {
            let activityUrl = utils.get(member, 'presence.activity.url') || '';

            if (activityUrl.indexOf('https://www.twitch.tv/') === 0) {
                activityUrl = activityUrl.split('/');
                activityUrl = activityUrl[activityUrl.length -1];
                streamingMembersUrl.push(activityUrl);
            } 
        });

        const now = Date.now();
        const memberId = newMember.id;
        if (newActivityType === 'STREAMING' && oldActivityType !== 'STREAMING' && !cooldowns.has(memberId)) {
            cooldowns.set(memberId, now);
            setTimeout(() => cooldowns.delete(memberId), cooldownAmount);
            let message = '@here \n\n' + newMember.displayName + ' has gone live at <' + utils.get(newPresence, 'activity.url') + '>';
            streamingChannel.send(message);
        }

        if (streamingMembersUrl.length > 0) {
            let url = 'http://multitwitch.tv/' + streamingMembersUrl.join('/');
            streamingChannel.setTopic('MultiTwitch link: ' + url);
        } else {
            streamingChannel.setTopic('Theres nobody streaming...');
        }
    }

    promise.then(afterRoleChange).catch(afterRoleChange);

}

module.exports = {
    init: function (client) {
        client.on('presenceUpdate', checkStreaming);
    }
};