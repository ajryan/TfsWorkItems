(function () {
    "use strict";
    
    var appData = Windows.Storage.ApplicationData.current;

    WinJS.Namespace.define("Settings", {
        tfsUrl: initTfsUrl(),
        setTfsUrl: function(newUrl) {
            this.tfsUrl = newUrl;
            appData.localSettings.values["tfsUrl"] = newUrl;
            
            Data.getProjects();
            // TODO: force navigation to the items page if we're not there
        }
    });
    
    function initTfsUrl() {
        return Windows.ApplicationModel.DesignMode.designModeEnabled
            ? "http://testaddress.com:8080/tfs"
            : appData.localSettings.values["tfsUrl"];
    }
})();