sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"root/model/models",
	"root/model/Model",
   "root/model/hModel",
	"sap/m/routing/Router", // needed for packaging
	"sap/ui/core/ComponentSupport" // needed for packaging
], function (UIComponent, Device, models, RootModel, hRootModel) {
	"use strict";

	return UIComponent.extend("root.Component", {

		metadata: {
			manifest: "json"
		},

		
		// QUESTION: can we do it without Component.js, assign model directly for TreeTable control?
		
		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// old RootModel with flat list on server side
			// this.setModel(new RootModel("/data"));
			
			// this is new model, flat list produced on client side
			this.setModel(new hRootModel("/hierarchy"));

		}
	});
});