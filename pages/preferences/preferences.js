(function () {
    "use strict";
    
    WinJS.UI.Pages.define("/pages/preferences/preferences.html", {
        ready: function(element, options) {
            var tfsUrlInput = document.getElementById("tfsUrl");
            
            var tfsUrl = Settings.tfsUrl;
            if (tfsUrl !== undefined) {
                tfsUrlInput.value = tfsUrl;
            }
            
            tfsUrlInput.addEventListener("blur", this._onTfsUrlBlur, false);
        },
        unload: function() {
            
        },
        _onTfsUrlBlur: function() {
            var newUrl = this.value;
            
            var a = document.createElement('a');
            a.href = newUrl;
            
            var validUrl = (a.protocol.toLowerCase().indexOf('http') === 0);
            validUrl &= a.hostname && a.hostname.length > 1;
            
            if (validUrl) {
                Settings.setTfsUrl(newUrl);
            }
        },
        _validUrl: function(url) {
            return false;
        }
    });
})();