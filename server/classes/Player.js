import WSS from '../websocket.js';

const playerProxyHandlers = {
	set: (player, prop, val) => {
		player[prop] = val;
		WSS.broadcast(JSON.stringify({ method: 'player', steamid: player.steamid, prop: prop, val: val }));
		return true;
	},
};

class Player {
	constructor(user) {
		this.steamid = user.steamid;
		this.name = user.name;
		this.isReady = false;
		return new Proxy(this, playerProxyHandlers);
	}
}

export default Player;