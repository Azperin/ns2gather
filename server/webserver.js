import 'dotenv/config';
const SERVER_PORT = 3545;
const webServerOpts = {};

let hasCerificates = false;
if (process.env.SERVER_CERTIFICATE_PATH && process.env.SERVER_CERTIFICATE_KEY_PATH) {
	webServerOpts.key = fs.readFileSync(process.env.SERVER_CERTIFICATE_KEY_PATH);
	webServerOpts.cert = fs.readFileSync(process.env.SERVER_CERTIFICATE_PATH);
	hasCerificates = true;
};
const moduleName = hasCerificates ? 'node:https':'node:http';
const webserver = (await import(moduleName)).createServer(webServerOpts);
console.log(`Web server running with ${ moduleName } module`);

webserver.listen(SERVER_PORT);

export default webserver;