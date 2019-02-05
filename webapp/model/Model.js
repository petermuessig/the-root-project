sap.ui.define([
    "jquery.sap.global",
    "sap/ui/model/json/JSONModel",
    "root/model/ListBinding"
], function(jQuery, JSONModel, ListBinding) {
	"use strict";

    var RootModel = JSONModel.extend("root.model.Model", {

        constructor: function(sBaseUrl) {
            JSONModel.apply(this);
            this._sBaseUrl = sBaseUrl;
            this.setProperty("/", {
                nodes: {}
            });
        },

        bindTree: function(sPath, oContext, aFilters, mParameters, aSorters) {
            var oBinding = new ListBinding(this, sPath, oContext, aFilters, mParameters, aSorters);
            return oBinding;
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
                    //this.fireRequestCompleted({
                    //    type: sType, url : sUrl, method : sMethod, success: true
                    //});
                    
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
                //this.fireRequestSent({
                //    type: sType, url : sUrl, method : sMethod
                //});

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

    return RootModel;

});
