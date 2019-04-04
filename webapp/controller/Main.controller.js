sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"root/model/hModel"
], function (Controller, hRootModel) {
	"use strict";

	return Controller.extend("root.controller.Main", {


	   onInit: function() {
	      console.log('!!!Creating Main controller!!!!');

	      // assign model in the controller - more flexible solution for the complex applications
	      this.getView().setModel(new hRootModel("/hierarchy"), "browse");
	   },

	   changeSort: function() {
         var model = this.getView().getModel("browse");
         var kind = model.getProperty("/sortOrder");
         kind = (kind == "reverse") ? "direct" : "reverse";

         model.setProperty("/sortOrder", kind);
         if (model.changeSortOrder)
            model.changeSortOrder(kind);
	   },

	   sortOrderChanged: function() {

	      var model = this.getView().getModel("browse");

         var kind = model.getProperty("/sortOrder");

	      console.log('ORDER CHANGED', kind);

	      if (model.changeSortOrder)
	         model.changeSortOrder(kind);
	   }

	});
});