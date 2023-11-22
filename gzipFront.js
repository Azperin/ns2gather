const fs = require('node:fs');
const zlib = require('node:zlib');

function fn(path) {
	fs.readdirSync(path, { withFileTypes: true }).forEach(x => {
		if (x.isFile()) {
			if (x.name.endsWith('.js') || x.name.endsWith('.css')) {
				const fullPath = path + x.name;
				fs.writeFileSync(`${fullPath}.gz`, zlib.gzipSync(fs.readFileSync(fullPath), { level: 9 }));
			};
		} else if (x.isDirectory()) {
			fn(path + x.name + '/');
		};		
	});
};

fn('./client/html/');