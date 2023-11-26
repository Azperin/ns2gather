import _WSS from "./classes/Websocket.js";
import webserver from "./webserver.js";
import websocketRoutes from "./websocketRoutes.js";
import DB from "./database.js";
const WEBSOCKET_MAX_REQUEST_PER_SECONDS = 10;
const WSS = new _WSS({ perMessageDeflate: false, maxPayload: 1024 * 300, server: webserver });

/* 
	Handle upgrade on your own:
	https://github.com/websockets/ws/blob/401a5852dcdd313490a379563ecb523c3c71c406/examples/express-session-parse/index.js
*/

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
		} catch(e) { 
			return;
		 };
		const requestedMethod = message?.method;
		if (!websocketRoutes.hasOwnProperty(requestedMethod)) return;

		websocketRoutes[requestedMethod]({ DB, WSS, ws, message }); // call loaded method if exists
	});
});

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

export default WSS;