require('dotenv').config();
const zlib = require('node:zlib');
const fs = require('node:fs');
const DB = require('./db.js');
const WEBSOCKET = require('ws');
const CONSTANTS = require('./constants.js');
const WEBSOCKET_MAX_REQUEST_PER_SECONDS = 10;
const WEBSOCKET_ROUTES = new Wsroutes();

WEBSOCKET.Server.prototype.broadcast = function(message, compressLevel = 0) {
	// yea, patching is evil
	let binary = false;
	if (compressLevel) {
		message = zlib.gzipSync(message, { level: compressLevel });
		binary = true;
	};
	
	this.clients.forEach(client => {
		if (client.readyState !== 1) return;
		client.send(message, { isBinary: binary, compress: false }); // msg, options, cb
	});
};

let tmpWSS;
if (process.env.SERVER_CERTIFICATE_PATH && process.env.SERVER_CERTIFICATE_KEY_PATH) {
	const https = require('https');
	const server = https.createServer({ 
		key: fs.readFileSync(process.env.SERVER_CERTIFICATE_KEY_PATH), 
		cert: fs.readFileSync(process.env.SERVER_CERTIFICATE_PATH)
	});
	tmpWSS = new WEBSOCKET.Server({ perMessageDeflate: false, server: server });
	server.listen(CONSTANTS.WEBSOCKET_DEFAULT_PORT);
} else {
	console.log('Local run without SSL');
	tmpWSS = new WEBSOCKET.Server({ 
		port: CONSTANTS.WEBSOCKET_DEFAULT_PORT, 
		perMessageDeflate: false, 
		maxPayload: 1024 * 300,
	});
};
const WSS = tmpWSS;
tmpWSS = undefined;

WSS.on('connection', function(ws) {
	ws.isAlive = true;
	ws.lastRequestAt = Date.now();
	ws.spamRequestsCounter = 0;
	ws.on('close', () => '');
	ws.on('error', () => '');
	ws.on('pong', heartbeat);
	ws.on('message', (message) => {
		if (!message) return;
		const currentTime = Date.now();
		ws.spamRequestsCounter = (currentTime - ws.lastRequestAt) > 1000 ? 0 : (ws.spamRequestsCounter + 1);
		if (ws.spamRequestsCounter > WEBSOCKET_MAX_REQUEST_PER_SECONDS) return;
		ws.lastRequestAt = currentTime;
		
		try { 
			message = JSON.parse(message); 
		} catch { return; };
		const requestedMethod = message?.method;
		if (!WEBSOCKET_ROUTES.hasOwnProperty(requestedMethod)) return;

		WEBSOCKET_ROUTES[requestedMethod]({ DB, WSS, ws, message }); // call loaded method if exists
	});
});

function Wsroutes() {
	fs.mkdirSync(CONSTANTS.WEBSOCKET_ROUTES_ROOT_DIR, { recursive: true });

	const routesToCheck = [ CONSTANTS.WEBSOCKET_ROUTES_ROOT_DIR ];
	while(routesToCheck.length) {
		const route = routesToCheck.pop();
		fs.readdirSync(route, { withFileTypes: true } ).forEach(dirEntity => {
			if (dirEntity.isDirectory()) {
				routesToCheck.push(`${ route }/${ dirEntity.name }`);
			} else {
				if (!dirEntity.name.endsWith('.js')) return;
				const modulePath = `${ route }/${ dirEntity.name }`;
				const methodName = modulePath.replace(`${ CONSTANTS.WEBSOCKET_ROUTES_ROOT_DIR }/`, '').replaceAll('/', '_').replace('.js', '');
				this[methodName] = require(modulePath);
			};
		});
	};

	return this;
};

function heartbeat() {
	this.isAlive = true;
};

setInterval(() => {
	WSS.clients.forEach((ws) => {
	if (ws.isAlive === false) return ws.terminate();
		ws.isAlive = false;
		ws.ping();
	});
}, 30000);

module.exports = WSS;