import fs from 'node:fs';
import User from './User.js';
fs.mkdirSync('./db/users', { recursive: true });

const usersProxyHandlers = {
	set: (users, prop, val) => {
		users[prop] = val;
		fs.writeFileSync(`./db/users/${ prop }.json`, JSON.stringify(users[prop]), 'utf8');
		return true;
	},
};

class Users {
	constructor() {
		loadUsersFromDB(this);
		return new Proxy(this, usersProxyHandlers);
	}

	addUser(steamid) {
		if (!steamid) {
			throw new Error('No SteamID provided');
		};

		if (!this.hasOwnProperty(steamid)) {
			this[steamid] = new User(steamid);
		};

		return this[steamid];
	}
}

function loadUsersFromDB(ctx) {
	fs.readdirSync('./db/users', { withFileTypes: true } ).forEach(user_id => {
		if (!user_id.name.endsWith('.json') || user_id.isDirectory()) return;
		const user = JSON.parse(fs.readFileSync(`${ user_id.path }/${ user_id.name }`, 'utf8'));
		ctx[user.steamid] = new User(user.steamid, user);
	});
}

export default Users;