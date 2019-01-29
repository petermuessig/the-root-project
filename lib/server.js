/**
 * The server modules is responsible to start a DEV server
 * and handle the incoming URLs to distrute them to the UI5
 * server or to handle the data requests locally.
 */
'use strict';

const express = require('express');
const proxy = require('http-proxy-middleware');
const compression = require('compression');

const app = express();

let nodeByPath = {};

let root = {
	"name": "ROOT",
	"type": "folder",
	"nodes": [],
	"path": "/",
	"expanded": true,
	"level": 0
};
nodeByPath[root.path] = root;

function buildNodes(node) {
	if (node.type === "folder" && node.level < 3) {
		for (let i = 0; i < 10; i++) {
			let child = {
				"name": "Folder" + i,
				"type": "folder",
				"nodes": [],
				"path": node.path + "Folder" + i + "/",
				"level": node.level + 1
			};
			nodeByPath[child.path] = child;
			buildNodes(child);
			child.expanded = child.nodes.length > 0;
			node.nodes.push(child);
		}
		for (let i = 0; i < 25; i++) {
			let child = {
				"name": "File" + i,
				"type": "file",
				"path": node.path + "File" + i,
				"level": node.level + 1
			};
			nodeByPath[child.path] = child;
			node.nodes.push(child);
		}
	}
}
buildNodes(root);

function flattenTree(node, nodes) {
	let flatNodes = nodes || [];
	flatNodes.push({
		"name": node.name,
		"type": node.type,
		"path": node.path,
		"level": node.level,
		"expanded": node.expanded,
		"index": flatNodes.length
	});
	if (node.expanded && node.nodes) {
		node.nodes.forEach(function(value, index, arr) {
			flattenTree(value, flatNodes);
		});
	}
	return flatNodes;
}

// compress all responses
app.use(compression({
	filter: function shouldCompress(req, res) {
		if (req.originalUrl.match(/^\/resources/)) {
			return false; // do not compress resources requests
		}
		// fallback to standard filter function
		return compression.filter(req, res);
	}
}));

// handle the data requests to resources
app.get('/data', function (req, res) {
	if (req.query.toggle) {
		// not optimal but simple, should just sketch the idea! => very expensive to toggle like this!!!!
		let data = flattenTree(root); 
		let indexToToggle = parseInt(req.query.toggle);
		let node = nodeByPath[data[indexToToggle].path];
		node.expanded = !node.expanded;
	}
	let data = flattenTree(root);
	let start = parseInt(req.query.top) || 0;
	let end = start + parseInt(req.query.length || data.length);
	let responseData = {
		"nodes": data.slice(start, end),
		"length": data.length
	}
	res.write(JSON.stringify(responseData, 2, "\t"));
	res.contentType = "text/json";
	res.end();
});

// handle the data requests to resources
app.get('/test', function (req, res) {
	console.log("Requested resource: " + req.params[0] + " - " + JSON.stringify(req.query));
	res.write("Requested resource: " + req.params[0] + " - " + JSON.stringify(req.query));
	res.write("\n\n");
	let data = flattenTree(root);
	let start = parseInt(req.query.top) || 0;
	let end = start + parseInt(req.query.length || data.length);
	res.write("Start: " + start + " - End: " + end);
	res.write("\n\n");
	let responseData = {
		"nodes": data.slice(start, end),
		"length": data.length
	}
	res.write(JSON.stringify(responseData, 2, "\t"));
	res.contentType = "text/plain";
	res.end();
});

// forward requests to resources to the UI5 dev server
app.use("/resources", proxy({target: "http://localhost:8080/", pathRewrite: {
	'^/resources/' : '/resources/'
}, changeOrigin: true}));

// serve the webapp folder locally
app.use(express.static('webapp', {
	etag: true,
	//maxAge: 12 * 60 * 60 * 1000
}));

// listen to port 3000 by default
let port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log('Server listening on port ' + port + '\n');
});
