import 'dotenv/config';
import CACHE from "../cache.js";
import Readyroom from './Readyroom.js';
import WSS from '../websocket.js';
const DISCORD_HOOK_URL = process.env.DISCORD_HOOK_URL;
const hookOpts = { messageCacheLifetime: 60, messageSweepInterval: 60 };
import { EmbedBuilder, WebhookClient } from 'discord.js';
const WEBHOOK = DISCORD_HOOK_URL ? (new WebhookClient({ url: DISCORD_HOOK_URL }, hookOpts)) : undefined;
const GATHER_CHECKING_DURATION = parseInt(process.env.GATHER_CHECKING_DURATION, 10) || 15;
const GATHER_GRACE_PERIOD_DURATION = parseInt(process.env.GATHER_GRACE_PERIOD_DURATION, 10) || 15;
const GATHER_STATE_ACTIONS = {
	'gathering': (gather) => {
		const embededMsg = new EmbedBuilder();
		const readyRoomCount = Object.values(gather.readyroom).length;
		if (readyRoomCount) return;
		
		embededMsg.setColor('ff0000');
		embededMsg.setTitle('https://ns2gather.ru');
		embededMsg.setDescription('New gather was created, come and join !');
		embededMsg.setURL('https://ns2gather.ru/')
		// embededMsg.setAuthor({ name: 'string'});
		// embededMsg.setThumbnail(url);
		// embededMsg.setImage(url);
		// embededMsg.addFields({ name: 'fieldname1', value: 'fieldvalue1' });
		// embededMsg.addFields({ name: 'fieldname2', value: 'fieldvalue2' });
		// embededMsg.addFields({ name: 'fieldname3', value: 'fieldvalue3' });
		WEBHOOK.send({ content: null, embeds:[ embededMsg ] }).catch(e => '');
	},
	'checking': (gather) => {
		const embededMsg = new EmbedBuilder();
		const readyRoomCount = Object.values(gather.readyroom).length;
		const checkingEndsAt = Math.floor(Date.now() / 1000) + GATHER_CHECKING_DURATION;
		embededMsg.setColor('fff500');
		embededMsg.setTitle('https://ns2gather.ru');
		embededMsg.setDescription(`We have ${ readyRoomCount } players in readyroom!\n<t:${ checkingEndsAt }:R> checking stage will be close and ones who did not confirm their ready state will be blocked for some time.`);
		embededMsg.setURL('https://ns2gather.ru/');
		WEBHOOK.send({ content: null, embeds:[ embededMsg ] }).catch(e => '');
	},
	'gathered': (gather) => {
		const embededMsg = new EmbedBuilder();
		const readyRoomObj = Object.values(gather.readyroom);
		const readyRoomCount = readyRoomObj.length;
		const checkedPlayersCount = readyRoomCount.filter(player => player.isReady).length;
		const graceEndsAt = Math.floor(Date.now() / 1000) + GATHER_GRACE_PERIOD_DURATION;
		embededMsg.setColor('24ff00');
		embededMsg.setTitle('https://ns2gather.ru');
		embededMsg.setDescription(`Looks like we have gather ${ checkedPlayersCount } players, awaits them to join server.\n<t:${ graceEndsAt }:R> will be created a new instance of gather, shortly after we will recheck server and block players who was ready, but not connected to the server.`);
		embededMsg.setURL('https://ns2gather.ru/');
		WEBHOOK.send({ content: null, embeds:[ embededMsg ] }).catch(e => '');
	},
};

const gatherProxyHandlers = {
	set: (gather, prop, val) => {
		gather[prop] = val;
		CACHE.gatherSyncMessage = '';
		if (prop === 'state') {
			if (WEBHOOK) {
				GATHER_STATE_ACTIONS[val]?.(gather);
			};
		};

		WSS.broadcast(JSON.stringify({ method: 'gather', prop: prop, val: val }));

		return true;
	},
};

class Gather {
	constructor(state = 'gathering') {
		this.id = Date.now();
		this.state = state;
		this.readyroom = new Readyroom();
		return new Proxy(this, gatherProxyHandlers);
	}

	resetGather() {
		this.readyroom.clearAll();
		this.id = Date.now();
		this.state = 'gathering';
		return this;
	}
}


export default Gather;