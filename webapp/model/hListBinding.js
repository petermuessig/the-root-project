sap.ui.define([
    "sap/base/Log", 
    "sap/ui/model/json/JSONListBinding"
], function(Log, JSONListBinding) {
    "use strict";

    var bLoading = false;

    var hRootListBinding = JSONListBinding.extend("root.model.hListBinding", {

        // called by the TreeTable to know the amount of entries
        getLength: function() {
            Log.warning("root.model.hListBinding#getLength()");
            return this.getModel().getLength();
        },

        // function is called by the TreeTable when requesting the data to display
        getNodes: function(iStartIndex, iLength, iThreshold) {

           Log.warning("root.model.hListBinding#getNodes(" + iStartIndex + ", " + iLength + ", " + iThreshold + ")");

           var res = this.getModel().getNodes(iStartIndex, iLength, iThreshold);
           
           Log.warning("root.model.hListBinding#getNodes(res.length = " + res.length + ")");
           
           return res;
           
        },

        getContextByIndex: function(iIndex) {
            Log.warning("root.model.hListBinding#getContextByIndex(" + iIndex + ")");
        },

        findNode: function() {
            Log.warning("root.model.hListBinding#findNode()");
        },
    
        nodeHasChildren: function(oNode) {
            Log.warning("root.model.hListBinding#nodeHasChildren(" + oNode.context.getPath() + ")");
            return oNode.type === "folder";
        },
    
        isExpanded: function(iIndex) {
            Log.warning("root.model.hListBinding#isExpanded(" + iIndex + ")");
            return this.getNodes(iIndex, 1)[0].nodeState.expanded;
        },

        expand: function(iIndex) {
            Log.warning("root.model.hListBinding#expand(" + iIndex + ")");
        },
    
        collapse: function(iIndex) {
            Log.warning("root.model.hListBinding#collapse(" + iIndex + ")");
        },
    
        // called by the TreeTable when a node is expanded/collapsed
        toggleIndex: function(iIndex) {
            Log.warning("root.model.hListBinding#toggleIndex(" + iIndex + ")");
            var oContext = this.getModel().getContext(this.getPath() + "/" + iIndex);
            oContext.getProperty().expanded = !oContext.getProperty().expanded;
            this.getModel().toggleNode(oContext.getProperty("index"));
        },
    
        getSelectedIndex: function() {
            Log.warning("root.model.hListBinding#getSelectedIndex(" + JSON.stringify(arguments) + ")");
        },
    
        isIndexSelectable: function() {
            Log.warning("root.model.hListBinding#isIndexSelectable(" + JSON.stringify(arguments) + ")");
        }

    });

    return hRootListBinding;

});