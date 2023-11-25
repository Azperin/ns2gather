const PLAYER_CARD_TEMPLATE = document.getElementById('player-card-template');

const GATHER = new Proxy({
	gatherElement: document.getElementById('gather'),
	mySteamid: '',
	isBlocked: false,
	state: 'loading',
	readyroom: new Readyroom(),
}, {
	set: (gather, prop, val) => {
		const prevValue = gather[prop];
		gather[prop] = val;

		if (prop === 'mySteamid') {
			if (!val) {
				gather.gatherElement.classList.remove('logged');
				gather.gatherElement.classList.remove('joined');
				gather.gatherElement.classList.remove('checked');
			} else {
				gather.gatherElement.classList.add('logged');
				const isJoined = gather.readyroom.hasOwnProperty(val);
				gather.gatherElement.classList.toggle('joined', isJoined);
				if (isJoined) {
					const isChecked = gather.readyroom[val].isReady;
					gather.gatherElement.classList.toggle('checked', isChecked);
				} else {
					gather.gatherElement.classList.remove('checked');
				};
			};
		};

		if (prop === 'state') {
			gather.gatherElement.classList.toggle(prevValue, false);
			gather.gatherElement.classList.toggle(val, true);
		};

		if (prop === 'isBlocked') {
			gather.gatherElement.classList.toggle('blocked', val);
		};

		return true;
	},
});

const WEBSOCKET_ROUTES = {
	'auth': ({ steamid = '', isBlocked = false }) => {
		GATHER.mySteamid = steamid;
		GATHER.isBlocked = isBlocked;

		if (!steamid) {
			return localStorage.removeItem('gathertoken');
		};
	},

	'gather_sync': ({ gather }) => {
		GATHER.state = gather.state;
		GATHER.id = gather.id;
		GATHER.readyroom.clearRoom().fillRoom(gather.readyroom);
	},

	'readyroom': ({ player, steamid }) => {
		if (player) {
			GATHER.readyroom.addPlayer(player);
			return;
		};

		if (steamid) {
			GATHER.readyroom.removePlayer(steamid);
			return;
		};
	},

	'gather': ({ prop, val }) => {
		GATHER[prop] = val;
	},

	'player': ({ steamid, prop, val }) => {
		GATHER.readyroom[steamid][prop] = val;
	},
};

const WEBSOCKET = new WebSocket(getWebsocketAddress());

WEBSOCKET.addEventListener('message', async ({ data }) => {
	if (data instanceof Blob) {
		data = await data.arrayBuffer();
		data = pako.ungzip(data, { to: 'string' });
	};

	data = JSON.parse(data);
	console.log(data);
	WEBSOCKET_ROUTES[data.method]?.(data);
});

WEBSOCKET.addEventListener('open', () => {
	const localToken = localStorage.getItem('gathertoken') || '';
	if (localToken) {
		const [ steamid, token ] = localToken.split('@');
		WEBSOCKET.send(JSON.stringify({ method: 'auth', steamid: steamid, token: token }));
	};

	WEBSOCKET.send(JSON.stringify({ method: 'gather_sync' }));
});

WEBSOCKET.addEventListener('error', () => {
	// document.querySelector('.loader').textContent = 'Lost connection';
	GATHER.state = 'loading';
});

WEBSOCKET.addEventListener('close', () => {
	// document.querySelector('.loader').textContent = 'Lost connection';
	GATHER.state = 'loading';
});

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

Readyroom.prototype.fillRoom = function(players) {
	Object.values(players).forEach(player => {
		this.addPlayer(player);
	});

	return this;
};

Readyroom.prototype.clearRoom = function() {
	Object.keys(this).forEach(steamid => {
		this.domElement?.remove();
		delete this[steamid];
	});

	return this;
};

const playerProxyHandlers = {
	set: (player, playerProp, val) => {
		player[playerProp] = val;

		if (playerProp === 'isReady') {
			player.playerCardElement.classList.toggle('is-ready', val);
			if (GATHER.mySteamid === player.steamid) {
				GATHER.gatherElement.classList.toggle('checked', val);
			};
			
			const counter = Object.values(GATHER.readyroom).filter(x => x.isReady).length;
			document.querySelector('.ready-counter span').innerText = `${ counter }`;
		};

		return true;
	},
};

function Player(player) {
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
