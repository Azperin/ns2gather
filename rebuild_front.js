const fs = require('node:fs');
const zlib = require('node:zlib');
const cacheTime = Date.now();

fs.rmSync('./client/dist', { recursive: true, force: true });
fs.cpSync('./client/html', './client/dist', { force: true, recursive: true });

const indexHtml = fs.readFileSync('./client/dist/index.html', 'utf8');
const newIndexHtml = indexHtml.replace('<link rel="stylesheet" href="style.css" />', `<link rel="stylesheet" href="style.${ cacheTime }.css" />`).replace('<script src="script.js"></script>', `<script src="script.${ cacheTime }.js"></script>`);
fs.writeFileSync('./client/dist/index.html', newIndexHtml, 'utf8');

fs.renameSync('./client/dist/script.js', `./client/dist/script.${ cacheTime }.js`);
fs.renameSync('./client/dist/style.css', `./client/dist/style.${ cacheTime }.css`);

gzipStatic('./client/dist/');

function gzipStatic(path) {
	fs.readdirSync(path, { withFileTypes: true }).forEach(x => {
		if (x.isFile()) {
			if (x.name.endsWith('.js') || x.name.endsWith('.css')) {
				const fullPath = path + x.name;
				fs.writeFileSync(`${fullPath}.gz`, zlib.gzipSync(fs.readFileSync(fullPath), { level: 9 }));
			};
		} else if (x.isDirectory()) {
			gzipStatic(path + x.name + '/');
		};		
	});
};

console.log('Done');
