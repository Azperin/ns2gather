export default ({DB, ws, message: { gid } }) => {
	if (!ws.steamid) return;
	if (DB.gather.id !== gid) return;
	if (DB.gather.state !== 'gathering') return;
	if (DB.gather.readyroom.hasOwnProperty(ws.steamid)) return;
	if (DB.users[ws.steamid].blockUntil > Date.now()) return;

	DB.gather.readyroom.addPlayer(DB.users[ws.steamid]);

	const enoughPlayersJoined = DB.gather.readyroom.isEnoughPlayersJoined();
	if (enoughPlayersJoined) {
		DB.gather.state = 'checking';
		const checkingDuration = 15000;
		
		setTimeout(() => {
			const enoughPlayersReady = DB.gather.readyroom.isEnoughPlayersReady();

			if (enoughPlayersReady) {
				const graceDuration = 15000;
				DB.gather.state = 'gathered';

				setTimeout(() => {
					DB.gather.resetGather();
				}, graceDuration);
				
			} else {
				DB.gather.readyroom.clearNotReady();
				DB.gather.state = 'gathering';
			};
		}, checkingDuration);
	};
};