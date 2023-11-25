import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { gzipSync } from 'node:zlib';
import { createServer } from 'node:https';
const opts = { port: 3545, perMessageDeflate: false, server: undefined, maxPayload: 1024 * 300 };

if (process.env.SERVER_CERTIFICATE_PATH && process.env.SERVER_CERTIFICATE_KEY_PATH) {
	const server = createServer({ 
		key: fs.readFileSync(process.env.SERVER_CERTIFICATE_KEY_PATH), 
		cert: fs.readFileSync(process.env.SERVER_CERTIFICATE_PATH)
	});
	opts.server = server;
	server.listen(opts.port);
};

class _WSS extends WebSocketServer {
	constructor() {
		super(opts);
		return this;
	}

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

