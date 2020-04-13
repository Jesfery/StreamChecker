const utils = require('../utils.js');

function getStreamingActivity(presence) {
    let activity = null;

    presence && presence.activities.every(a => {
        if (a.type === 'STREAMING') {
            activity = a;
            return false;
        }
    });

    return activity;
}

module.exports = {
    name: 'multitwitchlink',
    description: 'Get a multitwitch link for all currently streaming members',
    aliases: ['mtl'],
    cooldown: 1,
    guildOnly: true,

    execute(message, args) {
        return new Promise((resolve, reject) => {
            let guild = message.member.guild;

            let streamingRole = guild.roles.cache.find(role => role.name === 'now-streaming');
            if (!streamingRole) {
                resolve('Streaming role does not exist');
                return;
            }

            let streamingMembersUrl = [];
            streamingRole.members.forEach(member => {
                let activity = getStreamingActivity(member.presence),
                    activityUrl = activity.url;

                if (activityUrl && activityUrl.indexOf('https://www.twitch.tv/') === 0) {
                    activityUrl = activityUrl.split('/');
                    activityUrl = activityUrl[activityUrl.length - 1];
                    streamingMembersUrl.push(activityUrl);
                }
            });
        
            if (streamingMembersUrl.length > 0) {
                streamingMembersUrl = 'http://multitwitch.tv/' + streamingMembersUrl.join('/');

                if (args.length > 0) {
                    if (args[0] === 'ping') {
                        streamingMembersUrl = '@here ' + streamingMembersUrl;
                    }
                }

                resolve(streamingMembersUrl);
                return;
            }

            resolve('Theres nobody streaming...');
        });
    }
};