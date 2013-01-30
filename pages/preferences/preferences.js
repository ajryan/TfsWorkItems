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
            tfsUrlInput.addEventListener("keyup", this._onTfsUrlKeyup, false);
        },
        unload: function() {
            
        },
        _onTfsUrlBlur: function() {
            var newUrl = this.value;
            if (validUrl(newUrl)) {
                Settings.setTfsUrl(newUrl);
            }
        },
        _onTfsUrlKeyup: function(e) {
            if (e.keyCode == 13 && validUrl(this.value)) {
                Settings.setTfsUrl(this.value);
            }
        }
    });
    
    function validUrl(url) {
        var a = document.createElement('a');
        a.href = url;

        var isValid = (a.protocol.toLowerCase().indexOf('http') === 0);
        isValid &= a.hostname && a.hostname.length > 1;
            
        return isValid;
    }
})();