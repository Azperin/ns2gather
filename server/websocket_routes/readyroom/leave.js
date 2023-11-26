export default ({DB, ws, message: { gid } }) => {
	if (!ws.steamid) return;
	if (DB.gather.id !== gid) return;
	if (DB.gather.state !== 'gathering') return;
	if (!DB.gather.readyroom.hasOwnProperty(ws.steamid)) return;
	
	DB.gather.readyroom.removePlayer(ws.steamid);
	
};