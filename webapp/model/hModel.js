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
                nodes: {}, // nodes shown in the TreeTable, should be flat list
                length: 0  // total number of elements 
            });
            
            // this is true hierarchy, created on the client side and used for creation of flat list 
            this.h = {
               _name: "ROOT",
               _expanded: true
            };
            
            this.loadDataCounter = 0; // counter of number of nodes
            
            this.sortOrder = "";
            
            this.threshold = 100; // default threshold to prefetch items
            
            // submit top-level request already when construct model
            this.submitRequest(this.h, "/");
        },
        
        bindTree: function(sPath, oContext, aFilters, mParameters, aSorters) {
           Log.warning("root.model.hModel#bindTree()");
           this.oBinding = new hListBinding(this, sPath, oContext, aFilters, mParameters, aSorters);
           return this.oBinding;
        },

        getLength: function() {
           return this.getProperty("/length");
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

        // submit next request to the server 
        // now using simple HTTP requests, in ROOT websocket communication will be used
        submitRequest: function(elem, path, first, number) {
           
           if (elem._requested) return;
           elem._requested = true;
           
           this.loadDataCounter++;
           
           var request = "path=" + path;
           if ((first !== undefined) && (number !== undefined))
              request += "&first=" + first + "&number=" + number;
           
           if (this.sortOrder)
              request += "&sort=" + this.sortOrder;

           // TODO: here is just HTTP request, in ROOT we will use websocket to send requests and process replies 
           jQuery.ajax({
              url: this._sBaseUrl + "?" + request,
              dataType: "json",
              method: "GET"
          }).done(function(responseData, textStatus, jqXHR) {

             this.loadDataCounter--;
             
             this.processResponse(responseData);
              
          }.bind(this)).fail(function(rpath, jqXHR, textStatus, errorThrown) {
              
             this.loadDataCounter--;
             
             // log the error for debugging to see the issue when checking the log
             jQuery.sap.log.error("Failed to read data for " + rpath + "! Reason: " + errorThrown);
              
          }.bind(this, request));
        },
        
        processResponse: function(reply) {
           var elem = this.getNodeByPath(reply.path);
           
           if (!elem) { console.error('DID NOT FOUND ' + reply.path); return; }
           
           if (!elem._requested) console.error('ELEMENT WAS NOT REQUESTED!!!!', reply.path);
           delete elem._requested;
           
           var smart_merge = false;
           
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
           
           this.scanShifts();

           // reset existing nodes if reply does not match with expectation 
           if (!smart_merge)
              this.reset_nodes = true;

           if (this.loadDataCounter == 0)
              if (this.oBinding) 
                 this.oBinding.checkUpdate(true);
        },
        
        // return element of hierarchical structure by TreeTable index 
        getElementByIndex: function(indx) {
           var data = this.getProperty("/"),
               node = data.nodes[indx];
           
           return node ? node._elem : null;
        },
        
        // function used to calculate all ids shifts and total number of elements
        scanShifts: function() {
           
           var id = 0;
           
           function scan(lvl, elem, path) {
              
              id++;

              var before_id = id;
              
              if (elem._expanded) {
                 if (elem._childs === undefined) {
                    // do nothing, childs are not visible as long as we do not have eny list
                    
                    // id += 0; 
                 } else {

                    if (elem._first) 
                       id += elem._first;

                    for (var k=0;k<elem._childs.length;++k)
                       scan(lvl+1, elem._childs[k], path + elem._childs[k]._name + "/");
                    
                    // check elements at the end
                    var _last = (elem._first || 0) + elem._childs.length;
                    var _remains = elem._nchilds  - _last;
                    if (_remains > 0) id += _remains;
                 }
              }
              
              elem._shift = id - before_id;  
           }

           scan(0, this.h, "/");
           
           this.setProperty("/length", id);
           
           return id;
        },
        
        
        // central method to create list of flat nodes using also selection when provided
        // returns -1 if there are running requests otherwise returns total number of items
        buildFlatNodes: function(args) {

           var pthis = this,
               id = 0,         // current id, at the same time number of items
               threshold = args.threshold || this.threshold || 100,
               threshold2 = Math.round(threshold/2),
               nodes = this.reset_nodes ? {} : this.getProperty("/nodes");
           
           // main method to scan through all existing sub-folders
           function scan(lvl, elem, path) {
              // create elements with safety margin
              if ((nodes !== null) && !nodes[id] && (id >= args.begin - threshold2) && (id < args.end + threshold2) ) 
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

              if (!elem._expanded) return;
                 
              if (elem._childs === undefined) {
                 // add new request - can we check if only special part of childs is required? 

                 // TODO: probably one could guess more precise request
                 pthis.submitRequest(elem, path);
                 
                 return;  
              } 

              // check if scan is required
              if (((id + elem._shift) < args.begin - threshold2) || (id >= args.end + threshold2)) {
                 id += elem._shift;
                 return;
              }
                    
              // when not all childs from very beginning is loaded, but may be required
              if (elem._first) {
                       
                 // check if requests are needed to load part in the begin of the list
                 if (args.begin - id - threshold2 < elem._first) {

                    var first = Math.max(args.begin - id - threshold2, 0),
                        number = Math.min(elem._first - first, threshold);
                    
                    pthis.submitRequest(elem, path, first, number);
                 }

                 id += elem._first;
              }

              for (var k=0;k<elem._childs.length;++k)
                 scan(lvl+1, elem._childs[k], path + elem._childs[k]._name + "/");

              // check if more elements are required

              var _last = (elem._first || 0) + elem._childs.length;
              var _remains = elem._nchilds  - _last;

              if (_remains > 0) {
                 if (args.end + threshold2 > id) {
                    
                    var first = _last, number = args.end + threshold2 - id;
                    if (number < threshold) number = threshold; // always request much  
                    if (number > _remains) number = _remains; // but not too much 
                    if (number > threshold) {
                       first += (number - threshold);
                       number = threshold;
                    }
                    
                    pthis.submitRequest(elem, path, first, number);
                 }

                 id += _remains;
              } 
           }
           
           scan(0, this.h, "/");
           
           if (this.getProperty("/length") != id) {
              console.error('LENGTH MISMATCH', this.getProperty("/length"), id);
              this.setProperty("/length", id); // update length property
           }

           if (this.reset_nodes) {
              this.setProperty("/nodes", nodes);
              delete this.reset_nodes;
           }

           return id;
        },

        toggleNode: function(index) {
           
           var elem = this.getElementByIndex(index);
           if (!elem) return;
           
           console.log('Toggle element', elem._name)
           
           if (elem._expanded) {
              delete elem._expanded;
              delete elem._childs;

              // close folder - reassign shifts
              this.reset_nodes = true;
              this.scanShifts();
              
              return true;
              
           } else if (elem.type === "folder") {
              
              elem._expanded = true;
              // structure is changing but not immediately
              
              return true;
              
           } else {
              // nothing to do
              return;
           }
           
           // for now - reset all existing nodes and rebuild from the beginning
           // all nodes should be created from scratch
           
           // no need to update - this should be invoked from openui anyway
           //   if (this.oBinding) this.oBinding.checkUpdate(true);
        },
        
        changeSortOrder: function(newValue) {
           if (newValue === undefined)
               newValue = this.getProperty("/sortOrder") || "";

           if ((newValue !== "") && (newValue !=="direct") && (newValue !== "reverse")) {
              console.error('WRONG sorting order ', newValue, 'use default');
              newValue = "";
           }
           
           // ignore same value
           if (newValue === this.sortOrder)
              return;
           
           
           this.sortOrder = newValue;
           
           // now we should request values once again

           this.submitRequest(this.h, "/");
           
        }

    });
    
    return hRootModel;

});
