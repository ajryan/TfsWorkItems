(function () {
    "use strict";
    
    var appData = Windows.Storage.ApplicationData.current;

    WinJS.Namespace.define("Settings", {
        tfsUrl: initTfsUrl(),
        setTfsUrl: function (newUrl) {
            if (this.tfsUrl == newUrl && (Data.processingStatus || Data.projects.length > 0))
                return;
            
            this.tfsUrl = newUrl;
            appData.localSettings.values["tfsUrl"] = newUrl;
            
            Data.loadProjects();
        }
    });
    
    function initTfsUrl() {
        return Windows.ApplicationModel.DesignMode.designModeEnabled
            ? "http://testaddress.com:8080/tfs"
            : appData.localSettings.values["tfsUrl"];
    }
})();