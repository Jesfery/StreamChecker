const utils = require('../utils.js');

function checkStreaming(oldPresence, newPresence) {
    let newMember = newPresence.member;

    if (!newMember) {
        return;
    }

    let guild = newMember.guild,
        newActivityType = utils.get(newPresence, 'activity.type'),
        oldActivityType = utils.get(oldPresence, 'activity.type'),
        promise,
        memberWentLive = false;

    if (!guild.streamingRole) {
        guild.streamingRole = guild.roles.find(role => role.name === 'now-streaming');
        if (!guild.streamingRole) {
            return;
        }
    }

    let streamingChannel = guild.channels.find(channel => {
        return channel.name === 'now-streaming' && channel.type === 'text';
    });

    if (!streamingChannel) {
        return;
    }

    if (newActivityType === 'STREAMING') {
        if (oldActivityType !== 'STREAMING') {
            //let url = utils.get(newPresence, 'activity.url');
            //streamingChannel.send(newMember.displayName + ' has gone live. Check it out at <' + url + '>');
            memberWentLive = true;
        }
        promise = newMember.roles.add(guild.streamingRole);
    } else {
        promise = newMember.roles.remove(guild.streamingRole);
    }

    promise.then(() => {    
        let streamingMembersUrl = [];
        guild.streamingRole.members.forEach(member => {
            let activityUrl = utils.get(member, 'presence.activity.url');

            if (activityUrl && activityUrl.length > 0) {
                activityUrl = activityUrl.split('/');
                activityUrl = activityUrl[activityUrl.length -1];
                streamingMembersUrl.push(activityUrl);
            } 
        });

        if (streamingMembersUrl.length > 0) {
            let url = 'http://multitwitch.tv/' + streamingMembersUrl.join('/');
            streamingChannel.setTopic('MultiTwitch link: ' + url);
            if (memberWentLive) {
                streamingChannel.send('@here ' + newMember.displayName + ' has gone live at <' + utils.get(newPresence, 'activity.url') + '>\n\nThe updated multitwitch link is <' + url + '>');
            }
        } else {
            streamingChannel.setTopic('Theres nobody streaming...');
        }
    });

}

module.exports = {
    init: function (client) {
        client.on('presenceUpdate', checkStreaming);
    }
};