sap.ui.define([
    "sap/ui/core/Element", "sap/ui/table/TreeTable"
], function(Element, TreeTable) {
	"use strict";

    var RootTreeTable = TreeTable.extend("root.data.TreeTable", {

        getBinding: function(sName) {
            sName = sName || "rows";
            var oBinding = Element.prototype.getBinding.call(this, sName);
            if (oBinding && !oBinding.isA("root.data.ListBinding")) {
                throw new Error("Binding not supported by root.data.TreeTable");
            }    
            return oBinding;
        },
    
        renderer: {}
    
    });

    return RootTreeTable;

});
