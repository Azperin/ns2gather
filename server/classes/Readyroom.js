import 'dotenv/config';
import Player from "./Player.js";
import WSS from '../websocket.js';

const GATHER_JOIN_THRESHOLD = process.env.GATHER_JOIN_THRESHOLD;
const GATHER_READY_THRESHOLD = process.env.GATHER_READY_THRESHOLD;

const readyroomProxyHandlers = {
	set: (readyroom, prop, val) => {
		readyroom[prop] = val;
		WSS.broadcast(JSON.stringify({ method: 'readyroom', player: val }));
		return true;
	},
	deleteProperty: function(readyroom, steamid) {
		delete readyroom[steamid];
		WSS.broadcast(JSON.stringify({ method: 'readyroom', steamid: steamid }));
		return true;
	},
};

class Readyroom {
	constructor() {
		return new Proxy(this, readyroomProxyHandlers);
	}

	addPlayer(user) {
		if (!user) {
			throw new Error('User required to add to readyroom');
		};

		if (!this.hasOwnProperty(user.steamid)) {
			this[user.steamid] = new Player(user);
		};

		return this[user.steamid];
	}

	removePlayer(steamid) {
		if (this.hasOwnProperty(steamid)) {
			delete this[steamid];
		};

		return this;
	}

	clearNotReady() {
		Object.keys(this).forEach(steamid => {
			if (this[steamid].isReady) {
				this[steamid].isReady = false;
			} else {
				delete this[steamid];
			};
		});

		return this;
	}

	clearAll() {
		Object.keys(this).forEach(steamid => {
			delete this[steamid];
		});
	}

	isEnoughPlayersJoined() {
		return Object.keys(this).length >= GATHER_JOIN_THRESHOLD;
	}

	isEnoughPlayersReady() {
		return Object.values(this).filter(player => player.isReady).length >= GATHER_READY_THRESHOLD;
	};
}

export default Readyroom;