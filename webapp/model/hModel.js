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
        
        processResponse: function(path, rnodes) {
           var elem = this.getNodeByPath(path);
           
           if (!elem) { console.error('DID NOT FOUND ' + path); return; }
           
           elem._childs = rnodes;

           if (this.buildFlatNodes() > 0)
              if (this.oBinding) this.oBinding.checkUpdate(true);
        },
        
        // return element of hierarchical structure by TreeTable index 
        getElementByIndex: function(indx) {
           var data = this.getProperty("/"),
               node = data.nodes[indx];
           
           return node ? node._elem : null;
        },
        
        // central method to create list of flat nodes using also selection when provided
        buildFlatNodes: function(build_nodes) {

           if (this.loadDataCounter > 0) return 0; // do not update until all requests are processed

           var id = 0, req = []; // current id, at the same time number of items
           
           var data = null;
           
           if (build_nodes) {
              data = this.getProperty("/");
              data.nodes = {};
              data.length = 0;
           }
           
           function scan(lvl, elem, path) {
              // path = !path ? "/" : path + "/" + elem._name;

              if (build_nodes) 
                 data.nodes[id] = {
                    name: elem._name,
                    level: lvl,
                    index: id,
                    _elem: elem,
                    // these are fully optional, one can use element itself
                    type: elem.type,
                    isLeaf: elem.type === "file",
                    expanded: !!elem._expanded
                 }
              
              id++;
              
              if (!elem._expanded) return;
              
              if (elem._childs === undefined) {
                 req.push(path);
                 return;
              }
              
              for (var k=0;k<elem._childs.length;++k)
                 scan(lvl+1, elem._childs[k], path + elem._childs[k]._name + "/");
           }
           
           scan(0, this.h, "/");
           
           if (!req.length) {
              if (build_nodes) {
                 data.length = id;
                 this.setProperty("/", data);
              } else {
                 this.setProperty("/length", id); // update only length property
              }
              return id;
           }

           // submit new requests which are now needed
           for (var n=0;n<req.length;++n) {
              this.loadDataCounter++;

              jQuery.ajax({
                 url: this._sBaseUrl + "?path=" + req[n],
                 dataType: "json",
                 method: "GET"
             }).done(function(rpath, responseData, textStatus, jqXHR) {

                this.loadDataCounter--;
                
                this.processResponse(rpath, responseData);
                 
             }.bind(this, req[n])).fail(function(rpath, jqXHR, textStatus, errorThrown) {
                 
                this.loadDataCounter--;
                
                // log the error for debugging to see the issue when checking the log
                jQuery.sap.log.error("Failed to read data for " + rpath + "! Reason: " + errorThrown);
                 
             }.bind(this, req[n]));
           }

           // do not return valid number of elements
           return 0;
        },

        toggleNode: function(index) {
           
           var elem = this.getElementByIndex(index);
           if (!elem) return;
           
           console.log('Toggle element', elem._name)
           
           if (elem._expanded) {
              delete elem._expanded;
              delete elem._childs;
           } else if (elem.type === "folder") {
              elem._expanded = true; 
           } else {
              // nothing to do
              return;
           }
           
           if (this.buildFlatNodes() > 0)
              if (this.oBinding) this.oBinding.checkUpdate(true);
        }

    });
    
    return hRootModel;

});
