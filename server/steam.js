require('dotenv').config();
const STEAM_LOGIN = process.env.STEAM_LOGIN;
const STEAM_PASSWORD = process.env.STEAM_PASSWORD;
if (!STEAM_LOGIN && !STEAM_PASSWORD) {
	throw new Error('REQUIRE STEAM ACCOUNT. Add credentials for your bot steam account in .env file. Variables are STEAM_LOGIN and STEAM_PASSWORD');
};
const DB = require('./db.js');
const CONSTANTS = require('./constants.js');
const SteamUser = require('steam-user');
const STEAM_USER = new SteamUser();
const PERSONAS_TO_UPDATE = new Set(Object.values(DB.users).filter(user => !user.name && user.steamid.length > 10).map(user => user.steamid));
let isSteamUserOnline = false;

STEAM_USER.on('loggedOn', () => {
	STEAM_USER.setPersona(1); // keep appearance online
	isSteamUserOnline = true;
});

STEAM_USER.on('friendMessage', (steamID, message) => {
	const steamid = steamID.getSteamID64();
	if (!steamid) return;
	if (!DB.users.hasOwnProperty(steamid)) {
		DB.addUser(steamid);
		PERSONAS_TO_UPDATE.add(steamid);
	};

	if (message === '!auth') {
		const msg = `/spoiler ${ steamid }@${ DB.users[steamid].token }`;

		STEAM_USER.chat.sendFriendMessage(steamid, msg, (err) => {
			if (err) return;
		});
	};
});

STEAM_USER.on('friendRelationship', (steamID, relationType) => {
	const steamid = steamID.getSteamID64();
	if (!steamid) return;
	if (relationType !== 2) return; // friend request
	STEAM_USER.addFriend(steamid, (err) => {
		if (err) return;
		DB.addUser(steamid);
		PERSONAS_TO_UPDATE.add(steamid);
		const msg = `/spoiler ${ steamid }@${ DB.users[steamid].token }`;

		STEAM_USER.chat.sendFriendMessage(steamid, msg, (err) => {
			if (err) return;
		});
	});
});

STEAM_USER.on('friendsList', () => {
	// accept offline friend requests
	Object.keys(STEAM_USER.myFriends).forEach(steamid => {
		if (STEAM_USER.myFriends[steamid] !== 2) return;
		STEAM_USER.addFriend(steamid, (err) => {
			if (err) return;

			DB.addUser(steamid);
			PERSONAS_TO_UPDATE.add(steamid);
			const msg = `/spoiler ${ steamid }@${ DB.users[steamid].token }`;
	
			STEAM_USER.chat.sendFriendMessage(steamid, msg, (err) => {
				if (err) return;
			});
		});
	});
});

STEAM_USER.on('error', () => {
	throw new Error('STEAM USER IS FATAL DEAD');
});

STEAM_USER.on('disconnected', () => {
	isSteamUserOnline = false;
});

STEAM_USER.logOn({
	accountName: process.env.STEAM_LOGIN,
	password: process.env.STEAM_PASSWORD,
	rememberPassword: true,
});

setInterval(() => {
	if (!isSteamUserOnline) return;
	if (PERSONAS_TO_UPDATE.size === 0) return;

	STEAM_USER.getPersonas([...PERSONAS_TO_UPDATE], (err, personas) => {
		if (err || !personas) return;
		Object.keys(personas).forEach(steamid => {
			if (!DB.users.hasOwnProperty(steamid)) return;
			DB.users[steamid].name = personas[steamid].player_name ?? '';
			DB.users[steamid].avatar = personas[steamid].avatar_url_medium?.replace(CONSTANTS.STEAM_AVATAR_DEFAULT_URL, '') ?? '';
			PERSONAS_TO_UPDATE.delete(steamid);
		});
	});
}, 30000);

