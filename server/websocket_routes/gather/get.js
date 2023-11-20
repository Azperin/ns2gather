const CONSTANTS = require('../../constants.js');
const zlib = require('node:zlib');

module.exports = ({DB, ws }) => {
	if (!DB.gather[CONSTANTS.GATHER_CACHE_PROPERTY_NAME]) {
		DB.gather[CONSTANTS.GATHER_CACHE_PROPERTY_NAME] = zlib.gzipSync(JSON.stringify({
			method: 'gather_get',
			gather: DB.gather,
		}, (key, value) => {
			if (key === CONSTANTS.GATHER_CACHE_PROPERTY_NAME) return; // exclude cache prop
			return value;
		}), { level: 9 });
	};

	ws.send(DB.gather[CONSTANTS.GATHER_CACHE_PROPERTY_NAME]);
};