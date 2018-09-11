const utils = require('../utils.js');

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
        promise = newMember.roles.add(guild.streamingRole);
    } else {
        promise = newMember.roles.remove(guild.streamingRole);
    }

    function afterRoleChange() {    
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

            if (newActivityType === 'STREAMING' && oldActivityType !== 'STREAMING') {
                streamingChannel.send('@here ' + newMember.displayName + ' has gone live at <' + utils.get(newPresence, 'activity.url') + '>\n\nThe updated multitwitch link is <' + url + '>');
            } else {
                console.log(`${newMember.displayName} - ${new Date().toString()}\n  New: ${newActivityType}\n  Old: ${oldActivityType}`);
            }
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