export default ({DB, ws }) => {
	if (!ws.steamid) return;
	if (DB.gather.state !== 'checking') return;
	// check for blocks
	if (DB.gather.readyroom[ws.steamid].isReady) return;

	// can players join readyroom during checking period ?

	if (!DB.gather.readyroom.hasOwnProperty(ws.steamid)) {
		DB.gather.readyroom.addPlayer(DB.users[ws.steamid]);
	};

	DB.gather.readyroom[ws.steamid].isReady = true;

};

