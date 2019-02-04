sap.ui.define([
    "sap/base/Log", 
    "sap/ui/model/json/JSONListBinding"
], function(Log, JSONListBinding) {
    "use strict";

    var bLoading = false;

    var RootListBinding = JSONListBinding.extend("root.model.ListBinding", {

        // called by the TreeTable to know the amount of entries
        getLength: function() {
            Log.warning("root.model.ListBinding#getLength()");
            return this.getModel().getProperty("/length") || 0;
        },

        // function is called by the TreeTable when requesting the data to display
        getNodes: function(iStartIndex, iLength, iThreshold) {
            Log.warning("root.model.ListBinding#getNodes(" + iStartIndex + ", " + iLength + ", " + iThreshold + ")");
            var data = this.getModel().getProperty(this.getPath());
            var aNodes = [];
            if (!bLoading) {
                for (var i = iStartIndex, l = iStartIndex + iLength; i < l; i++) {
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
                if (aNodes.length != Math.min(iLength, this.getModel().getProperty("/length"))) {
                    bLoading = true;
                    this.getModel().loadEntries(iStartIndex, iLength, iThreshold).then(function() {
                        bLoading = false;
                        this.checkUpdate(true); // force update
                    }.bind(this), function() {
                        bLoading = false;
                        this.checkUpdate(true); // force update
                    }.bind(this));
                    return [];
                }
            }
            return aNodes;
        },

        getContextByIndex: function(iIndex) {
            Log.warning("root.model.ListBinding#getContextByIndex(" + iIndex + ")");
        },

        findNode: function() {
            Log.warning("root.model.ListBinding#findNode()");
        },
    
        nodeHasChildren: function(oNode) {
            Log.warning("root.model.ListBinding#nodeHasChildren(" + oNode.context.getPath() + ")");
            return oNode.type === "folder";
        },
    
        isExpanded: function(iIndex) {
            Log.warning("root.model.ListBinding#isExpanded(" + iIndex + ")");
            return this.getNodes(iIndex, 1)[0].nodeState.expanded;
        },

        expand: function(iIndex) {
            Log.warning("root.model.ListBinding#expand(" + iIndex + ")");
        },
    
        collapse: function(iIndex) {
            Log.warning("root.model.ListBinding#collapse(" + iIndex + ")");
        },
    
        // called by the TreeTable when a node is expanded/collapsed
        toggleIndex: function(iIndex) {
            Log.warning("root.model.ListBinding#toggleIndex(" + iIndex + ")");
            var oContext = this.getModel().getContext(this.getPath() + "/" + iIndex);
            oContext.getProperty().expanded = !oContext.getProperty().expanded;
            this.getModel().toggleNode(oContext.getProperty("index"));
        },
    
        getSelectedIndex: function() {
            Log.warning("root.model.ListBinding#getSelectedIndex(" + JSON.stringify(arguments) + ")");
        },
    
        isIndexSelectable: function() {
            Log.warning("root.model.ListBinding#isIndexSelectable(" + JSON.stringify(arguments) + ")");
        }

    });

    return RootListBinding;

});