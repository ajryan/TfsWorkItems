(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));
        }
    });

    app.oncheckpoint = function (args) {
        // app will be suspended. save nav history.
        app.sessionState.history = nav.history;
    };
    
    app.onsettings = function (e) {
        e.detail.applicationcommands = { "connection": { title: "Connection", href: "/pages/preferences/preferences.html" } };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    };
    
    // show the processing progress bar and message, when the processing event
    // is fired, or upon navigating in case processing began before nav
    app.addEventListener(Data.processingEvent, showProcessing, false);
    WinJS.Navigation.addEventListener("navigated", showProcessing, false);
    
    app.start();
    
    function showProcessing() {
        var topProgress = document.getElementById("topProgress");
        topProgress && (topProgress.style.display = Data.processingStatus ? "block" : "none");

        var processingMessage = document.getElementById("processingMessage");
        processingMessage && (processingMessage.textContent = Data.processingMessage);
    }
})();