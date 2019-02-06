sap.ui.define([
    "sap/base/Log", 
    "sap/ui/model/json/JSONListBinding"
], function(Log, JSONListBinding) {
    "use strict";

    var bLoading = false;

    var hRootListBinding = JSONListBinding.extend("root.model.hListBinding", {

        // called by the TreeTable to know the amount of entries
        getLength: function() {
            // Log.warning("root.model.hListBinding#getLength()");
            return this.getModel().getLength();
        },

        // function is called by the TreeTable when requesting the data to display
        getNodes: function(iStartIndex, iLength, iThreshold) {

           Log.warning("root.model.hListBinding#getNodes(" + iStartIndex + ", " + iLength + ", " + iThreshold + ")");

           var args = {
              begin: iStartIndex,
              end: iStartIndex + iLength,
              threshold: iThreshold 
           };
           
           var totalLen = this.getModel().buildFlatNodes(args);
           
           var aNodes = [];
           
           if (totalLen > 0) {
              for (var i = args.begin; i < args.end; i++) {
                 var oNode = args.nodes[i];
                 if (oNode) {
                     aNodes.push({
                         type: oNode.type,
                         isLeaf: oNode.type === "file",
                         level: oNode.level,
                         
                         // QUESTION: seems to be, this is required by JSONListBinding?
                         context: this.getModel().getContext(this.getPath() + "/" + i),
                         nodeState: {  
                             expanded: !!oNode._elem._expanded, 
                             selected: !!oNode._elem._selected,
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
           // Log.warning("root.model.hListBinding#nodeHasChildren(" + oNode.type + ")");
            return oNode.type === "folder";
        },
    
        isExpanded: function(iIndex) {
            var elem = this.getModel().getElementByIndex(iIndex);
            var res = elem ? !!elem._expanded : false;
            
            Log.warning("root.model.hListBinding#isExpanded(" + iIndex + ") res = " + res);
            
            return res;
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
            this.getModel().toggleNode(iIndex);
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