module.exports = ({DB, WSS, ws }) => {
	if (!ws.steamid) return;
	if (DB.gather.state !== 'checking') return;
	if (!DB.gather.readyroom.hasOwnProperty(ws.steamid)) return;

	DB.gather.readyroom[ws.steamid].isReady = true;

	const msg = JSON.stringify({ method: 'readyroom', steamid: ws.steamid, check: true });
	WSS.broadcast(msg);
};