const fs = require('node:fs');
const CONSTANTS = require('./constants.js');
const PROXY_HANDLERS = require('./proxyHandlers.js');
const DB = new Database();

function Database() {
	this.users = {};
	this.gather = new Gather();
	return this;
};

Database.prototype.addUser = function(steamid, user) {
	if (!steamid) {
		throw new Error('STEAM_ID REQUIRED');
	};

	if (!this.users.hasOwnProperty(steamid)) {
		this.users[steamid] = new User(steamid, user);
		if (!user) {
			this.users[steamid].name = this.users[steamid].name; // trigger proxy to save in local
		};
	};

	return this.users[steamid];
};

function User(steamid, user) {
	if (user) {
		Object.keys(user).forEach(key => this[key] = user[key]);
	} else {
		this.steamid = steamid;
		this.token = User.generateToken();
		this.name = '';
		this.avatar = '';
	};

	return new Proxy(this, PROXY_HANDLERS.user);
};

User.prototype.updateToken = function() {
	this.token = User.generateToken();
	return this;
};

User.generateToken = function(token_length = 160) {
	if (token_length < 1) {
		throw new Error('TOKEN LENGTH FUCKED UP');
	};
	let token = '';
	const SYBOLS_LENGTH = CONSTANTS.TOKEN_SYMBOLS.length;
	while(token_length--) {
		token += CONSTANTS.TOKEN_SYMBOLS[Math.floor(Math.random() * SYBOLS_LENGTH)];
	};
	return token;
};

function Gather() {
	this.state = 'gathering'; // ['gathering', 'checking', 'gathered'] TODO: add state descriptions to readme
	this.readyroom = new Readyroom(); // players
	this[CONSTANTS.GATHER_CACHE_PROPERTY_NAME] = '';
	return new Proxy(this, PROXY_HANDLERS.gather);
};

Gather.prototype.clearCache = function () {
	this[CONSTANTS.GATHER_CACHE_PROPERTY_NAME] = '';
	return this;
};

Gather.prototype.resetGather = function () {
	// or just create new Gather to this ?
	this.state = 'gathering';
	Object.keys(this.readyroom).forEach(key => {
		delete this.readyroom[key];
	});
	return this;
};

function Readyroom() {
	return new Proxy(this, PROXY_HANDLERS.readyroom);
};

Readyroom.prototype.gather = function() {
	return DB.gather;
};

Readyroom.prototype.addPlayer = function(steamid) {
	if (!steamid) {
		throw new Error('Cannot add user to readyroom without steamid');
	};

	if (!this.hasOwnProperty(steamid)) {
		this[steamid] = new Player(steamid);
	};

	return this[steamid];
};

Readyroom.prototype.removePlayer = function(steamid) {
	if (!steamid) {
		throw new Error('Cannot remove user from readyroom without steamid');
	};

	if (this.hasOwnProperty(steamid)) {
		delete this[steamid];
	};

	return this;
};

function Player(steamid) {
	this.steamid = steamid;
	this.isReady = false; // checked durning checking stage on gather
	return new Proxy(this, PROXY_HANDLERS.player);
};

Player.prototype.gather = function() {
	return DB.gather;
};

// populate DB with users from local file system
fs.mkdirSync(CONSTANTS.DB_USERS_FOLDER_PATH, { recursive: true });
fs.readdirSync(CONSTANTS.DB_USERS_FOLDER_PATH, { withFileTypes: true } ).forEach(user_id => {
	if (!user_id.name.endsWith('.json') || user_id.isDirectory()) return;
	const user = require(`${ CONSTANTS.DB_USERS_FOLDER_PATH }/${ user_id.name }`);
	DB.addUser(user_id.name.replace('.json', ''), user);
});

module.exports = DB;