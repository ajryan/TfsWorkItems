(function () {
    "use strict";
    
    WinJS.UI.Pages.define("/pages/preferences/preferences/html", {
        ready: function(element, options) {
            var tfsUrl = Windows.Storage.ApplicationData.current.roamingSettings.values["tfsUrl"];
            if (tfsUrl !== undefined) {
                
            }
        },
        unload: function() {
            
        }
    });
})();