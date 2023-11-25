
export default ({WSS, DB, ws }) => {
	ws.send(JSON.stringify({ method: 'gather_sync', gather: DB.gather }));
};