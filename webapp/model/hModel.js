sap.ui.define([
    "jquery.sap.global",
    "sap/ui/model/json/JSONModel",
    "root/model/hListBinding",
    "sap/base/Log"
], function(jQuery, JSONModel, hListBinding, Log) {
   "use strict";

    var hRootModel = JSONModel.extend("root.model.hModel", {

        constructor: function(sBaseUrl) {
            JSONModel.apply(this);
            this._sBaseUrl = sBaseUrl;
            this.setProperty("/", {
                nodes: {}
            });
            
            // this is hierarchy, created on the client side and used for creation of flat list 
            this.h = {
               _name: "ROOT",
               _expanded: true
            };
            
            this.loadDataCounter = 0; // counter of number of nodes
            
            // after shifts are assigned, one can jump over subfolders much faster
            this.assignShifts = true; 
        },
        
        bindTree: function(sPath, oContext, aFilters, mParameters, aSorters) {
           Log.warning("root.model.hModel#bindTree()");
           this.oBinding = new hListBinding(this, sPath, oContext, aFilters, mParameters, aSorters);
           return this.oBinding;
        },

        getLength: function() {
           
           var res = this.getProperty("/length") || 0;
           
           if (!res) res = this.buildFlatNodes();
           
           return res;
        },
        
        getNodeByPath: function(path) {
           var curr = this.h;
           if (!path || (typeof path !== "string") || (path == "/")) return curr;
           
           var names = path.split("/");
           
           while (names.length > 0) {
              var name = names.shift(), find = false;
              if (!name) continue;
              
              for (var k=0;k<curr._childs.length;++k) {
                 if (curr._childs[k]._name == name) {
                    curr = curr._childs[k];
                    find = true; 
                    break;
                 }
              }
              
              if (!find) return null;
           }
           return curr;
        },
        
        processResponse: function(reply) {
           var elem = this.getNodeByPath(reply.path);
           
           if (!elem) { console.error('DID NOT FOUND ' + reply.path); return; }
           
           var smart_merge = false;
           
           // TODO: one could merge items together to keep subfolder structures
           if ((elem._nchilds === reply.nchilds) && elem._childs && reply.nodes) {
              if (elem._first + elem._childs.length == reply.first) {
                 elem._childs = elem._childs.concat(reply.nodes);
                 smart_merge = true;
              } else if (reply.first + reply.nodes.length == elem._first) {
                 elem._first = reply.first;
                 elem._childs = reply.nodes.concat(elem._childs);
                 smart_merge = true;
              }
           }

           if (!smart_merge) {
              elem._nchilds = reply.nchilds;
              elem._childs = reply.nodes;
              elem._first = reply.first || 0;
           }

           if (this.buildFlatNodes() >= 0)
              if (this.oBinding) this.oBinding.checkUpdate(true);
        },
        
        // return element of hierarchical structure by TreeTable index 
        getElementByIndex: function(indx) {
           var data = this.getProperty("/"),
               node = data.nodes[indx];
           
           return node ? node._elem : null;
        },
        
        // central method to create list of flat nodes using also selection when provided
        // returns -1 if there are running requests otherwise returns total number of items
        buildFlatNodes: function(args) {

           if (this.loadDataCounter > 0) return -1; // do not update until all requests are processed

           var id = 0, requests = [], assign_shifts = this.assignShifts; // current id, at the same time number of items
           
           var nodes = args ? this.getProperty("/nodes") : null;
           
           if ((nodes!==null) && this.reset_nodes) nodes = {};
           
           // main method to scan through all existing sub-folders
           function scan(lvl, elem, path) {
              
              if ((nodes !== null) && (id >= args.begin) && (id < args.threshold) && !nodes[id]) 
                 nodes[id] = {
                    name: elem._name,
                    level: lvl,
                    index: id,
                    _elem: elem,
                    
                    // these are optional, should be eliminated in the future
                    type: elem.type,
                    isLeaf: elem.type === "file",
                    expanded: !!elem._expanded
                 };
              
              id++;

              var before_id = id;
              
              if (elem._expanded) {
                 if (elem._childs === undefined) {
                    // add new request - can we check if only special part of childs is required? 
                    
                    requests.push("path=" + path); 
                    
                    id += elem._nchilds; // we know how many childs are
                 } else {

                    // check if scan is required
                    if (!assign_shifts && args && (((id + elem._shift) < args.begin) || (id >= args.threshold))) {
                       id += elem._shift;
                       return;
                    }
                    
                    // when not all childs, but only part of them are available
                    if (elem._first) {
                       // check if special requests is needed
                       if (!assign_shifts && args && (id < args.begin) && (id + elem._first >= args.begin)) {
                          // we need to request several more items
                          
                          var first = Math.max(args.begin - id - 10, 0),
                              number = Math.min(elem._first - first, 100);
                          
                          requests.push("path=" + path + "&first=" + first + "&number=" + number);
                       }  
                       
                       id += elem._first;
                    }

                    for (var k=0;k<elem._childs.length;++k)
                       scan(lvl+1, elem._childs[k], path + elem._childs[k]._name + "/");
                    
                    // check if more elements are required
                    
                    var _last = (elem._first || 0) + elem._childs.length;
                    var remains = elem._nchilds  - _last;
                    
                    if (remains > 0) {
                       if (!assign_shifts && args && (id < args.begin) && (id + remains >= args.begin)) {
                          var first = Math.max(_last, last + (args.begin-id) - 10),
                              number = Math.min(elem._nchilds - first, 100);
                          requests.push("path=" + path + "&first=" + first + "&number=" + number);
                       }
                       
                       id += remains;
                    } 
                 }
              }
              
              if (assign_shifts) elem._shift = id - before_id;  
           }
           
           scan(0, this.h, "/");
           
           if (!requests.length) {
              delete this.assignShifts; // shifts can be assigned once
              this.setProperty("/length", id); // update length property
              if (nodes !== null) {
                 this.setProperty("/nodes", nodes); 
                 args.nodes = nodes; // return back values required to
                 delete this.reset_nodes; // build complete
              }
              return id;
           }

           // submit new requests which are now needed
           for (var n=0;n<requests.length;++n) {
              this.loadDataCounter++;

              // TODO: here is just HTTP request, in ROOT we will use websocket to send requests and process replies 
              jQuery.ajax({
                 url: this._sBaseUrl + "?" + requests[n],
                 dataType: "json",
                 method: "GET"
             }).done(function(responseData, textStatus, jqXHR) {

                this.loadDataCounter--;
                
                this.processResponse(responseData);
                 
             }.bind(this)).fail(function(rpath, jqXHR, textStatus, errorThrown) {
                 
                this.loadDataCounter--;
                
                // log the error for debugging to see the issue when checking the log
                jQuery.sap.log.error("Failed to read data for " + rpath + "! Reason: " + errorThrown);
                 
             }.bind(this, requests[n]));
           }

           // if specific range was configured, we should wait until request is processed
           return args ? -1 : id;
        },

        toggleNode: function(index) {
           
           var elem = this.getElementByIndex(index);
           if (!elem) return;
           
           console.log('Toggle element', elem._name)
           
           if (elem._expanded) {
              delete elem._expanded;
              delete elem._childs;
              elem._shift = 0; // no expanded childs - no extra if=d shift, rest remain as is  
           } else if (elem.type === "folder") {
              elem._expanded = true; 
              this.assignShifts = true; // recheck shifts for all nodes 
           } else {
              // nothing to do
              return;
           }
           
           // for now - reset all existing nodes and rebuild from the beginning
           this.reset_nodes = true;
           
           if (this.buildFlatNodes() >= 0)
              if (this.oBinding) this.oBinding.checkUpdate(true);
        }

    });
    
    return hRootModel;

});
