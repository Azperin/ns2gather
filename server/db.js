const fs = require('node:fs');
const DB_USERS_FOLDER_PATH = './db/users';
const TOKEN_SYMBOLS = 'abcdefghijklmnopqrstuvwxyz_.!?$-ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'.split('');
const DB = new Database();
const userProxyHandlers = {
	set: function(user, userProperty, newValue ) {
		if (userProperty === 'steamid') {
			throw new Error(`CANNOT CHANGE STEAMID ON USER: ${ user[userProperty] } --- ${ newValue }`);
		};

		user[userProperty] = newValue;

		// autosave on changes
		fs.writeFileSync(`${ DB_USERS_FOLDER_PATH }/${ user.steamid }.json`, JSON.stringify(user, null, '\t'));

		return true;
	},
};

function Database() {
	this.users = {};
	return this;
};

Database.prototype.addUser = function(steamid, user) {
	if (!steamid) {
		throw new Error('STEAM_ID REQUIRED');
	};

	if (!this.users.hasOwnProperty(steamid)) {
		this.users[steamid] = new User(steamid, user);
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

	return new Proxy(this, userProxyHandlers);
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
	const SYBOLS_LENGTH = TOKEN_SYMBOLS.length;
	while(token_length--) {
		token += TOKEN_SYMBOLS[Math.floor(Math.random() * SYBOLS_LENGTH)];
	};
	return token;
};

function loadUsers() {
	fs.mkdirSync(DB_USERS_FOLDER_PATH, { recursive: true });
	fs.readdirSync(DB_USERS_FOLDER_PATH, { withFileTypes: true } ).forEach(user_id => {
		if (!user_id.name.endsWith('.json') || user_id.isDirectory()) return;
		const user = require(`${ DB_USERS_FOLDER_PATH }/${ user_id.name }`);
		DB.addUser(user_id.name.replace('.json', ''), user);
	});
};




loadUsers();
module.exports = DB;