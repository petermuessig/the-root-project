sap.ui.define([
	"sap/base/Log", 
	'sap/ui/model/json/JSONTreeBinding'
], function(Log, JSONTreeBinding) {
	"use strict";

	var TreeBinding = JSONTreeBinding.extend("root.model.TreeBinding", {

		constructor : function(oModel, sPath, oContext, aApplicationFilters, mParameters, aSorters){
			JSONTreeBinding.apply(this, arguments);
		}

	});

	TreeBinding.prototype.getRootContexts = function(iStartIndex, iLength) {
		Log.warning("TreeBinding#getRootContexts(" + iStartIndex + ", " + iLength + ")");
		return JSONTreeBinding.prototype.getRootContexts.apply(this, arguments);
	};

	TreeBinding.prototype.getNodeContexts = function(oContext, iStartIndex, iLength) {
		Log.warning("TreeBinding#getNodeContexts(" + oContext + ", " + iStartIndex + ", " + iLength + ")");
		return JSONTreeBinding.prototype.getNodeContexts.apply(this, arguments);
	};

	TreeBinding.prototype.hasChildren = function(oContext) {
		Log.warning("TreeBinding#hasChildren(" + oContext + ")");
		return JSONTreeBinding.prototype.hasChildren.apply(this, arguments);
	};

	TreeBinding.prototype.getChildCount = function(oContext) {
		Log.warning("TreeBinding#getChildCount(" + oContext + ")");
		return JSONTreeBinding.prototype.getChildCount.apply(this, arguments);
	};

	TreeBinding.prototype.sort = function() {
		Log.warning("TreeBinding#sort()");
		return JSONTreeBinding.prototype.sort.apply(this, arguments);
	};

	return TreeBinding;

});