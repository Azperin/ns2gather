const TOKEN_SYMBOLS = 'abcdefghijklmnopqrstuvwxyz_.!?$-ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'.split('');
import fs from 'node:fs';

const userProxyHandlers = {
	set: (user, prop, val) => {
		user[prop] = val;
		fs.writeFileSync(`./db/users/${ user.steamid }.json`, JSON.stringify(user), 'utf8');
		return true;
	},
};

class User {
	constructor(steamid, user) {
		if (user) {
			Object.keys(user).forEach(key => this[key] = user[key]);
		} else {
			this.steamid = steamid;
			this.token = User.generateToken();
			this.name = '';
			this.avatar = '';
			this.blocksCount = 0;
			this.blockUntil = 0;
		};

		return new Proxy(this, userProxyHandlers);
	}

	static generateToken(token_length = 160) {
		if (token_length < 1) {
			throw new Error('TOKEN LENGTH FUCKED UP');
		};

		let token = '';
		const SYBOLS_LENGTH = TOKEN_SYMBOLS.length;
		while(token_length--) {
			token += TOKEN_SYMBOLS[Math.floor(Math.random() * SYBOLS_LENGTH)];
		};
		return token;
	}
}

export default User;