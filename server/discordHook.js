require('dotenv').config();
const DISCORD_HOOK_URL = process.env.DISCORD_HOOK_URL;
const DISCORDJS = require('discord.js');
const WEBHOOK = DISCORD_HOOK_URL ? (new DISCORDJS.WebhookClient({ url: DISCORD_HOOK_URL}, { messageCacheLifetime: 60, messageSweepInterval: 60 })) : undefined;
const GATHER_STATE_ACTIONS = {
	'gathering': (gather) => {
		// const embededMsg = new DISCORDJS.EmbedBuilder();
		// embededMsg.setColor(0x0099FF);
		// embededMsg.setTitle('string');
		// embededMsg.setDescription('string');
		// embededMsg.setAuthor({ name: 'string'});
		// embededMsg.setThumbnail(url)
		// embededMsg.setImage(url)
		// embededMsg.addFields({ name: 'fieldname1', value: 'fieldvalue1' });
		// embededMsg.addFields({ name: 'fieldname2', value: 'fieldvalue2' });
		// embededMsg.addFields({ name: 'fieldname3', value: 'fieldvalue3' });
		// WEBHOOK.send({ content: null, embeds:[embededMsg] });
	},
	'checking': (gather) => {
		
	},
	'gathered': (gather) => {
		
	},
};

function DISCORD_SHOUT(gather) {
	if (!WEBHOOK && !gather) return;
	GATHER_STATE_ACTIONS[gather.state]?.(gather);
};

module.exports = DISCORD_SHOUT;