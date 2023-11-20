const fs = require('node:fs');
const CONSTANTS = require('./constants.js');
const PROXY_HANDLERS = {
	user: {
		set: function(user, userProperty, newValue ) {
			if (userProperty === 'steamid') {
				throw new Error(`CANNOT CHANGE STEAMID ON USER: ${ user[userProperty] } --- ${ newValue }`);
			};
	
			user[userProperty] = newValue;
	
			fs.writeFileSync(`${ CONSTANTS.DB_USERS_FOLDER_PATH }/${ user.steamid }.json`, JSON.stringify(user, null, '\t'));
	
			return true;
		},
	},

	gather: {
		set: function(gather, gatherProperty, newValue ) {
			if (gatherProperty !== CONSTANTS.GATHER_CACHE_PROPERTY_NAME) {
				gather.clearCache();
			};
	
			gather[gatherProperty] = newValue;
			return true;
		},
	},

	readyroom: {
		set: function(readyroom, rrProperty, newValue ) {
			readyroom[rrProperty] = newValue;
			readyroom.gather()?.clearCache();
			return true;
		},
		
		deleteProperty: function(readyroom, steamid) {
			delete readyroom[steamid];
			readyroom.gather()?.clearCache();
		},
	},

	player: {
		set: function(player, playerProperty, newValue ) {
			// can combine with readyroom, if we will handle player blocks outside proxy
			player[playerProperty] = newValue;
			player.gather()?.clearCache();
			return true;
		},
	},
};

module.exports = PROXY_HANDLERS;