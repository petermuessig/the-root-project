sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("root.controller.Main", {
	   
	   changeSort: function() {
         var model = this.getView().getModel(); 
         var kind = model.getProperty("/sortOrder");
         kind = (kind == "reverse") ? "direct" : "reverse";
         
         model.setProperty("/sortOrder", kind);
         if (model.changeSortOrder)
            model.changeSortOrder(kind);
	   },
	   
	   sortOrderChanged: function() {
	      
	      var model = this.getView().getModel(); 
	      
         var kind = model.getProperty("/sortOrder");

	      console.log('ORDER CHANGED', kind);
	      
	      if (model.changeSortOrder)
	         model.changeSortOrder(kind);
	   }

	});
});