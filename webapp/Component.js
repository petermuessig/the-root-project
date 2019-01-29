sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"root/model/models",
	"root/data/Model",
	"sap/m/routing/Router", // needed for packaging
	"sap/ui/core/ComponentSupport" // needed for packaging
], function (UIComponent, Device, models, RootModel) {
	"use strict";

	return UIComponent.extend("root.Component", {

		metadata: {
			manifest: "json"
		},

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

			// create and set the RootModel
			this.setModel(new RootModel("/data"));

		}
	});
});