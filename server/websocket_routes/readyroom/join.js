module.exports = ({DB, WSS, ws }) => {
	if (!ws.steamid) return;
	if (DB.gather.state !== 'gathering') return;
	if (DB.gather.readyroom.hasOwnProperty(ws.steamid)) return;
	if (DB.users[ws.steamid].blockUntil > Date.now()) return;

	const player = DB.gather.readyroom.addPlayer(ws.steamid);
	const msg = JSON.stringify({ method: 'readyroom', player: player });
	WSS.broadcast(msg, 7);

	const enoughPlayersJoined = DB.gather.readyroom.isEnoughPlayersReady();
	if (enoughPlayersJoined) {
		DB.gather.state = 'checking';
		const checkingDuration = 15000;
		const checkingStateMsg = JSON.stringify({ method: 'gather_state', state: DB.gather.state });
		WSS.broadcast(checkingStateMsg);
		
		// could be promise chain
		setTimeout(() => {
			const enoughPlayersReady = DB.gather.readyroom.isEnoughPlayersReady();

			if (enoughPlayersReady) {
				const graceDuration = 15000;
				const gatheredStateMsg = JSON.stringify({ method: 'gather_state', state: 'gathered' });

				WSS.broadcast(gatheredStateMsg);

				setTimeout(() => {
					DB.gather.resetGather();
					const newGatherMsg = JSON.stringify({ method: 'gather_get', gather: DB.gather });
					WSS.broadcast(newGatherMsg);
					gather_get
				}, graceDuration);
				
			} else {

				const blocks = DB.gather.readyroom.clear();
				const cleanedGatherMsg = JSON.stringify({ method: 'gather_get', gather: DB.gather });
				WSS.broadcast(cleanedGatherMsg);

			};
		}, checkingDuration);
	};
};