module.exports = ({DB, ws, message: { steamid, token } }) => {
	if (!steamid || !token) {
		ws.steamid = '';
		ws.send(JSON.stringify({ method: 'auth' }));
		return;
	};
	
	if (ws.steamid) return;
	
	if (!DB.users.hasOwnProperty(steamid)) return;
	
	if (DB.users[steamid].token !== token) return;

	ws.steamid = steamid;
	ws.send(JSON.stringify({ method: 'auth', steamid: steamid, blocksCount: DB.users[steamid], blockUntil: DB.users[steamid].blockUntil }));
};