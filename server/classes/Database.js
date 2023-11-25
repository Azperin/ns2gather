import Users from './Users.js';
import Gather from './Gather.js';

class Database {
	constructor() {
		this.users = new Users();
		this.gather = new Gather();
		return this;
	}
}

export default Database;