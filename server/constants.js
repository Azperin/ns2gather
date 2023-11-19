// any settings which is not required to be in .env file
const CONSTANTS = {};

Object.defineProperty(CONSTANTS, 'TOKEN_SYMBOLS', {
	value: 'abcdefghijklmnopqrstuvwxyz_.!?$-ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'.split(''),
	writable: false,
});

Object.defineProperty(CONSTANTS, 'DB_USERS_FOLDER_PATH', {
	value: './db/users',
	writable: false,
});

Object.defineProperty(CONSTANTS, 'GATHER_CACHE_PROPERTY_NAME', {
	value: 'cache',
	writable: false,
});

module.exports = CONSTANTS;