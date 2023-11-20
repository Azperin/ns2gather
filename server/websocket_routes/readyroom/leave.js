module.exports = ({DB, WSS, ws }) => {
	if (!ws.steamid) return;
	if (DB.gather.state !== 'gathering') return;
	if (!DB.gather.readyroom.hasOwnProperty(ws.steamid)) return;
	
	DB.gather.readyroom.removePlayer(ws.steamid);

	const msg = JSON.stringify({ method: 'readyroom', steamid: ws.steamid, leave: true });
	WSS.broadcast(msg);
};