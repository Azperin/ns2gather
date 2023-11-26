export default ({DB, ws, message: { gid } }) => {
	if (!ws.steamid || !gid) return;
	if (DB.gather.id !== gid) return;
	if (DB.gather.state !== 'checking') return;
	
	if (DB.gather.readyroom[ws.steamid].isReady) return;

	// can players join readyroom during checking period ?
	if (!DB.gather.readyroom.hasOwnProperty(ws.steamid)) {
		DB.gather.readyroom.addPlayer(DB.users[ws.steamid]).isReady = true;
	};
};

