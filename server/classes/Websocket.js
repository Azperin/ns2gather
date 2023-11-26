import { WebSocketServer } from 'ws';
import { gzipSync } from 'node:zlib';


class _WSS extends WebSocketServer {
	constructor(opts) {
		super(opts);
		return this;
	}

	// more like monkey patching
	broadcast(message, compressLevel = 0) {
		let binary = false;
		if (compressLevel) {
			message = gzipSync(message, { level: compressLevel });
			binary = true;
		};

		this.clients.forEach(client => {
			if (client.readyState !== 1) return;
			client.send(message, { isBinary: binary, compress: false });
		});
	}
}

export default _WSS;

