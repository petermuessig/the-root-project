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

           var aNodes = [];
           
           var totalLen = this.getModel().buildFlatNodes(true);
           if (totalLen > 0) {
              var beg = iStartIndex || 0;
              var end = Math.min(beg + (iLength || 100), totalLen);
              var data = this.getModel().getProperty(this.getPath());
              for (var i = beg; i < end; i++) {
                 var oNode = data[i];
                 if (oNode) {
                     aNodes.push({
                         context: this.getModel().getContext(this.getPath() + "/" + i),
                         type: oNode.type,
                         isLeaf:  oNode.type === "file",
                         level: oNode.level,
                         nodeState: {
                             expanded: oNode.expanded,
                             selected: oNode.selected,
                             sum: false
                         } 
                     });
                 }
              }
           }
           
           return aNodes;
           
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