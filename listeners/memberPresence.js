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
        promise;

    if (!guild.streamingRole) {
        guild.streamingRole = guild.roles.cache.find(role => role.name === 'now-streaming');
        if (!guild.streamingRole) {
            console.log(`${guild.name} - now-streaming role not found`);
            return;
        }
    }

    let streamingChannel = guild.channels.cache.find(channel => {
        return channel.name === 'now-streaming' && channel.type === 'text';
    });

    if (!streamingChannel) {
        console.log(`${guild.name} - now-streaming channel not found`);
        return;
    }    

    let activity = getStreamingActivity(newPresence);
    let oldActivity = getStreamingActivity(oldPresence);

    if (activity != null) {
        promise = newMember.roles.add(guild.streamingRole);
    } else {
        promise = newMember.roles.remove(guild.streamingRole);
    }

    function afterRoleChange() {    
        let streamingMembersUrl = [];
        guild.streamingRole.members.forEach(member => {
            let a = getStreamingActivity(member.presence),
                activityUrl = a && a.url;

            if (activityUrl && activityUrl.indexOf('https://www.twitch.tv/') === 0) {
                activityUrl = activityUrl.split('/');
                activityUrl = activityUrl[activityUrl.length -1];
                streamingMembersUrl.push(activityUrl);
            } 
        });

        const now = Date.now();
        const memberId = newMember.id;
        if (activity && !oldActivity && !cooldowns.has(memberId)) {
            cooldowns.set(memberId, now);
            setTimeout(() => cooldowns.delete(memberId), cooldownAmount);
            let message = '@here \n\n' + newMember.displayName + ' has gone live at <' + activity.url + '>';
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

function getStreamingActivity(presence) {
    let activity = null;

    presence && presence.activities.every(a => {
        if (a.type !== 'STREAMING') {
            return true;
        }
        activity = a;
    });

    return activity;
}

module.exports = {
    init: function (client) {
        client.on('presenceUpdate', checkStreaming);
    }
};