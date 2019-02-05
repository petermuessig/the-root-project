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
              
              for (var k=0;k<curr._childs;++k) {
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
           
           if (!elem) { console.eror('DID NOT FOUND ' + path); return; }
           
           console.log('path', path, "get nodes", rnodes);
           
           elem._childs = rnodes;

           if (this.buildFlatNodes() > 0)
              if (this.oBinding) this.oBinding.checkUpdate(true);
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
              path = !path ? "/" : path + "/" + elem._name;

              if (build_nodes) 
                 data.nodes[id] = {
                    name: elem._name,
                    level: lvl,
                    index: id,
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
                 scan(lvl+1, elem._childs[k], path);
           }
           
           scan(0, this.h, "");
           
           if (!req.length) {
              if (build_nodes) {
                 data.length = id;
                 this.setProperty("/", data);
              } else {
                 this.setProperty("/length", id); // update length property
              }
              console.log('PRODUCE ITEMS len', id);
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

        loadEntries: function(start, end, threshold) {

            return new Promise(function(resolve, reject) {

                var sType = "loadEntries";
                var sUrl = this._sBaseUrl + "?top=" + start + "&length=" + threshold; //end;
                var sMethod = "GET";
                
                jQuery.ajax({
                    url: sUrl,
                    dataType: "json",
                    method: sMethod
                }).done(function(responseData, textStatus, jqXHR) {

                    // update the model with the new data
                    var data = this.getProperty("/");
                    data.length = responseData.length || 0;
                    responseData.nodes.forEach(function(node, index, arr) {
                        data.nodes[node.index] = node
                    });
                    this.setProperty("/", data);
                    
                    // notify the listeners that the nodes has been loaded properly
                    this.fireRequestCompleted({
                        type: sType, url : sUrl, method : sMethod, success: true
                    });
                    
                    // resolve the Promise
                    resolve(data);
                    
                }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
                    
                    // log the error for debugging to see the issue when checking the log
                    jQuery.sap.log.error("Failed to read data! Reason: " + errorThrown);
                    
                    // update the model with and empty list of nodes
                    var data = this.getProperty("/");
                    data.length = 0;
                    data.nodes = {};
                    this.setProperty("/", data);
                    
                    // notify the listeners that the request failed and no nodes could be loaded
                    this.fireRequestCompleted({
                        type: sType, url : sUrl, method : sMethod,success: false, error: errorThrown
                    });
                    this.fireRequestFailed(errorThrown);
                    
                    // reject the Promise
                    reject(errorThrown);
                    
                }.bind(this));
                
                // notify the listeners that a request has been sent 
                this.fireRequestSent({
                    type: sType, url : sUrl, method : sMethod
                });

            }.bind(this));

        },

        toggleNode: function(index) {

            return new Promise(function(resolve, reject) {

                var sType = "toggleNode";
                var sUrl = this._sBaseUrl + "?toggle=" + index; //end;
                var sMethod = "GET";
                
                jQuery.ajax({
                    url: sUrl,
                    dataType: "json",
                    method: sMethod
                }).done(function(responseData, textStatus, jqXHR) {

                    // update the model with the new data
                    var data = this.getProperty("/");
                    data.length = responseData.length || 0;
                    data.nodes = {};
                    responseData.nodes.forEach(function(node, index, arr) {
                        data.nodes[node.index] = node;
                    });
                    this.setProperty("/", data);
                    
                    // notify the listeners that the nodes has been loaded properly
                    this.fireRequestCompleted({
                        type: sType, url : sUrl, method : sMethod, success: true
                    });
                    
                    // resolve the Promise
                    resolve(data);
                    
                }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
                    
                    // log the error for debugging to see the issue when checking the log
                    jQuery.sap.log.error("Failed to read data! Reason: " + errorThrown);
                    
                    // notify the listeners that the request failed and no nodes could be loaded
                    this.fireRequestCompleted({
                        type: sType, url : sUrl, method : sMethod,success: false, error: errorThrown
                    });
                    this.fireRequestFailed(errorThrown);
                    
                    // reject the Promise
                    reject(errorThrown);
                    
                }.bind(this));
                
                // notify the listeners that a request has been sent 
                this.fireRequestSent({
                    type: sType, url : sUrl, method : sMethod
                });

            }.bind(this));

        }

    });
    
    return hRootModel;

});
