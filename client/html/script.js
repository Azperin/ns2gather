const PLAYER_CARD_TEMPLATE = document.getElementById('player-card-template');

const GATHER = new Proxy({
	gatherElement: document.getElementById('gather'),
	mySteamid: '',
	state: 'loading',
	readyroom: new Readyroom(),
}, {
	set: (gatherObj, prop, val) => {
		const prevValue = gatherObj[prop];
		gatherObj[prop] = val;

		if (prop === 'mySteamid') {
			if (!val) {
				gatherObj.gatherElement.classList.remove('logged');
				gatherObj.gatherElement.classList.remove('joined');
				gatherObj.gatherElement.classList.remove('checked');
			} else {
				gatherObj.gatherElement.classList.add('logged');
				const isJoined = gatherObj.readyroom.hasOwnProperty(val);
				gatherObj.gatherElement.classList.toggle('joined', isJoined);
				if (isJoined) {
					const isChecked = gatherObj.readyroom[val].isReady;
					gatherObj.gatherElement.classList.toggle('checked', isChecked);
				} else {
					gatherObj.gatherElement.classList.remove('checked');
				};
			};
		};

		if (prop === 'state') {
			gatherObj.gatherElement.classList.toggle(prevValue, false);
			gatherObj.gatherElement.classList.toggle(val, true);
		};

		return true;
	},
});

const WEBSOCKET_ROUTES = {
	'auth': ({ steamid = '', blocksCount, blockUntil }) => {
		GATHER.mySteamid = steamid;
		if (!steamid) {
			return localStorage.removeItem('gathertoken');
		};
	},
	'gather_get': ({ gather, blocks }) => {
		// blocks contain information about previous failed checking phase
		GATHER.state = gather.state;
		GATHER.id = gather.id;

		Object.keys(GATHER.readyroom).forEach((steamid) => {
			GATHER.readyroom.removePlayer(steamid);
		});

		Object.values(gather.readyroom).forEach((player) => {
			GATHER.readyroom.addPlayer(player);
		});
	},
	'gather_state': ({ state }) => {
		GATHER.state = state;
	},
	'readyroom': ({ steamid, leave, isReady, player }) => {
		if (player) {
			GATHER.readyroom.addPlayer(player);
			return;
		};

		if (leave) {
			GATHER.readyroom.removePlayer(steamid);
			return;
		};

		if (isReady) {
			GATHER.readyroom[steamid].isReady = isReady;
			return;
		};
	},
};

const WEBSOCKET = new WebSocket(getWebsocketAddress());
WEBSOCKET.onopen = (e) => {
	const localToken = localStorage.getItem('gathertoken') || '';
	if (localToken) {
		const [ steamid, token ] = localToken.split('@');
		WEBSOCKET.send(JSON.stringify({ method: 'auth', steamid: steamid, token: token }));
	};

	WEBSOCKET.send(JSON.stringify({ method: 'gather_get' }));
};

WEBSOCKET.onerror = (e) => {
	GATHER.state = 'loading';
};
WEBSOCKET.onclose = (e) => {
	GATHER.state = 'loading';
};
WEBSOCKET.onmessage = async ({ data }) => {
	if (data instanceof Blob) {
		data = await data.arrayBuffer();
		data = pako.ungzip(data, { to: 'string' });
	};

	data = JSON.parse(data);
	WEBSOCKET_ROUTES[data.method]?.(data);
};

document.querySelector('.login-token-input').addEventListener('input', ({ target }) => {
	
	if (GATHER.mySteamid) return;
	if (!target.value || target.value.length < 160 || target.value.length > 250) return;
	const [ steamid, token ] = target.value.trim().split('@'); 
	if (steamid && token) {
		WEBSOCKET.send(JSON.stringify({ method: 'auth', steamid: steamid, token: token }));
		localStorage.setItem('gathertoken', `${ steamid }@${ token }`);
	};

	// should notify user if token format is invalid
	target.value = '';

});

document.querySelector('.rr-join-btn').addEventListener('click', (e) => {
	if (!GATHER.mySteamid) return;
	WEBSOCKET.send(JSON.stringify({ method: 'readyroom_join' }));
});

document.querySelector('.rr-leave-btn').addEventListener('click', (e) => {
	if (!GATHER.mySteamid) return;
	WEBSOCKET.send(JSON.stringify({ method: 'readyroom_leave' }));
});

document.querySelector('.rr-ready-btn').addEventListener('click', (e) => {
	if (!GATHER.mySteamid) return;
	WEBSOCKET.send(JSON.stringify({ method: 'readyroom_check' }));
});

document.querySelector('.logout-btn').addEventListener('click', () => {
	if (!GATHER.mySteamid) return;
	WEBSOCKET.send(JSON.stringify({ method: 'auth' }));
});

function getWebsocketAddress() {
	switch(location.protocol) {
		case('file:'): return "ws://localhost:3545";
		case('http:'): return `ws://${ location.hostname }:3545`;
		case('https:'): return `wss://${ location.hostname }:3545`;
		default: return 'dunno';
	};
};

function Readyroom() {
	return this;
};

Readyroom.prototype.addPlayer = function(player) {
	if (player.steamid === GATHER.mySteamid) {
		GATHER.gatherElement.classList.add('joined');
		GATHER.gatherElement.classList.toggle('checked', player.isReady);
	};

	this[player.steamid] = new Player(player);
	this[player.steamid].isReady = player.isReady; // trigger proxy ready counter
	const counter = Object.keys(this).length;
	document.querySelector('.joined-counter span').innerText = `${ counter }`;


	return this[player.steamid];
};

Readyroom.prototype.removePlayer = function(steamid) {
	if (steamid === GATHER.mySteamid) {
		GATHER.gatherElement.classList.remove('joined');
		GATHER.gatherElement.classList.remove('checked');
	};

	this[steamid].playerCardElement.remove();
	delete this[steamid];

	const playersArr = Object.values(this);
	const JoinCounter = playersArr.length;
	const ReadyCounter = playersArr.filter(x => x.isReady).length;
	document.querySelector('.joined-counter span').innerText = `${ JoinCounter }`;
	document.querySelector('.ready-counter span').innerText = `${ ReadyCounter }`;

	return this;
};

const playerProxyHandlers = {
	set: (player, playerProp, val) => {
		player[playerProp] = val;

		if (playerProp === 'isReady') {
			player.playerCardElement.classList.toggle('is-ready', val);
			GATHER.gatherElement.classList.toggle('checked', val);

			const counter = Object.values(GATHER.readyroom).filter(x => x.isReady).length;
			document.querySelector('.ready-counter span').innerText = `${ counter }`;
		};

		return true;
	},
};

function Player(player) {
	// should readyroom handle cards or players themselfs ?
	const el = document.importNode(PLAYER_CARD_TEMPLATE.content, true);
	const playerCardElement = el.querySelector('.player-card');

	playerCardElement.querySelector('.player-card .player-name').innerText = player.name || player.steamid;
	if (player.avatar) {
		playerCardElement.querySelector('.player-avatar-img').src = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${ player.avatar }`;
	};

	this.playerCardElement = playerCardElement;
	this.steamid = player.steamid;
	this.isReady = player.isReady;

	document.getElementById('readyroom').append(this.playerCardElement);
	this.playerCardElement.classList.toggle('is-ready', player.isReady);
	// const playerIsMe = GATHER.mySteamid === player.steamid;

	return new Proxy(this, playerProxyHandlers);
};
