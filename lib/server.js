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

let root = {
	"name": "ROOT",
	"type": "folder",
	"nodes": [],
	"path": "/",
	"expanded": true,
	"level": 0
};

function buildNodes(node) {
	if (node.type === "folder" && node.level < 3) {
	   var nfolders = node.level == 0 ? 200 : 20,
	       nfiles = 50;
	   
		for (let i = 0; i < nfolders; i++) {
			let child = {
				name: "Folder" + i,
				type: "folder",
				nodes: [],
				path: node.path + "Folder" + i + "/",
				level: node.level + 1
			};
			
			// mark child as expanded - should automatically expand on client side
			if (child.name == "Folder5") child._expanded = true;
			
			buildNodes(child);
			child.expanded = child.nodes.length > 0;
			node.nodes.push(child);
		}
		for (let i = 0; i < nfiles; i++) {
			let child = {
				"name": "File" + i,
				"type": "file",
				"path": node.path + "File" + i,
				"level": node.level + 1
			};
			node.nodes.push(child);
		}
	}
}

buildNodes(root);

// return node by path
function getNodeByPath(path) {
   if ((typeof path !== "string") || (path[0] !== "/")) return null;
   
   if (!path || (path === "/")) return root;
   
   var curr = root;
   
   var names = path.split("/");
   
   while (names.length > 0) {
      var name = names.shift(), find = false;
      if (!name) continue;
      
      for (var k=0;k<curr.nodes.length;++k) {
         if (curr.nodes[k].name == name) {
            curr = curr.nodes[k];
            find = true; 
            break;
         }
      }
      
      if (!find) return null;
   }
   
   return curr;
}

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

function doSorting(nodes, sort) {
   if (!sort) return nodes;
   
   var newnodes = [];
   
   newnodes = newnodes.concat(nodes);
   
   var func_normal = function(a,b) {
      return a.name < b.name ? -1 : 1;
   };

   var func_reverse = function(a,b) {
      return a.name > b.name ? -1 : 1;
   };

   
   newnodes.sort(sort=="reverse" ? func_reverse : func_normal);
   
   return newnodes;
}

// start with simple request which already exists in the ROOT itself, 
// should return items for specified folder
// following parameters are supported:
//   path - string path of requested node
//   first - first child to deliver (default 0)
//   number - number of childs to deliver 
//   sort - sorting order

app.get('/hierarchy', function (req, res) {
   
   let node = getNodeByPath(req.query.path);
   
   let reply = {
       path: req.query.path,
       nchilds: 0, // total number of childs in the path 
       first: 0,  // first child in the result 
       nodes: []  // requested childs
   };
   
   if (node && node.nodes) {
      
      console.log('Request path=',req.query.path,"first=", req.query.first || 0, "number=", req.query.number);
      
      var nodes = node.nodes;
      
      if (req.query.sort)
         nodes = doSorting(nodes, req.query.sort);
      
      reply.nchilds = nodes.length; 

      let first = 0; // only 100 items are send by default
      if (req.query.first) first = Math.max(0, parseInt(req.query.first));
      let number = 100;
      if (req.query.number) number = parseInt(req.query.number);
      let last = Math.min(nodes.length, first + number);
      
      reply.first = first;
      for (var k = first; k<last; ++k) {
         let sub = nodes[k];
         let chld = { _name: sub.name, type: sub.type };
         if (sub.nodes) chld._nchilds = sub.nodes.length; // provide also number of childs
         if (sub._expanded) chld._expanded = true; // deliver initial expand state to client
         reply.nodes.push(chld);
      }
   }
   
   console.log('Sending h reply len=' + reply.nodes.length);
   
   res.write(JSON.stringify(reply));
   res.contentType = "text/json";
   res.end();
});


// handle the data requests to resources
app.get('/data', function (req, res) {
	if (req.query.toggle) {
		// not optimal but simple, should just sketch the idea! => very expensive to toggle like this!!!!
		let data = flattenTree(root); 
		let indexToToggle = parseInt(req.query.toggle);
		console.log('toggle', indexToToggle, 'path', data[indexToToggle].path);
		let node = getNodeByPath(data[indexToToggle].path);
		node.expanded = !node.expanded;
	}
	let data = flattenTree(root);
	let start = parseInt(req.query.top) || 0;
	let end = start + parseInt(req.query.length || data.length);
	let responseData = {
		"nodes": data.slice(start, end),
		"length": data.length
	}
	console.log('Sending reply start=' + start + " end=" + end)
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
