import CACHE from "../../cache.js";
import { gzipSync } from 'node:zlib';

export default ({DB, ws }) => {
	if (!CACHE.gatherSyncMessage) {
		CACHE.gatherSyncMessage = gzipSync(JSON.stringify({ method: 'gather_sync', gather: DB.gather }), { level: 8 });
	};

	ws.send(CACHE.gatherSyncMessage, { isBinary: true, compress: false });
};