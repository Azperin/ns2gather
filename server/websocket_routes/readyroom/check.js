module.exports = ({DB, WSS, ws }) => {
	if (!ws.steamid) return;
	if (DB.gather.state !== 'checking') return;
	if (!DB.gather.readyroom.hasOwnProperty(ws.steamid)) return;
	if (DB.gather.readyroom[ws.steamid].isReady) return;

	DB.gather.readyroom[ws.steamid].isReady = true;

	const msg = JSON.stringify({ method: 'readyroom', steamid: ws.steamid, isReady: true });
	WSS.broadcast(msg);
};