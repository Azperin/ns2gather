import fs from 'node:fs';
const routesRoot = './websocket_routes';
fs.mkdirSync(routesRoot, { recursive: true });
const websocketRoutes = {};

const routesToCheck = [ routesRoot ];
while(routesToCheck.length) {
	const route = routesToCheck.pop();
	fs.readdirSync(route, { withFileTypes: true } ).forEach(async (dirEntity) => {
		if (dirEntity.isDirectory()) {
			routesToCheck.push(`${ route }/${ dirEntity.name }`);
		} else {
			if (!dirEntity.name.endsWith('.js')) return;
			const modulePath = `${ route }/${ dirEntity.name }`;
			const methodName = modulePath.replace(`${ routesRoot }/`, '').replaceAll('/', '_').replace('.js', '');
			websocketRoutes[methodName] = modulePath;
		};
	});
};

for await (const [ methodName, modulePath] of Object.entries(websocketRoutes)) {
	websocketRoutes[methodName] = (await import(modulePath)).default;
};

export default websocketRoutes;