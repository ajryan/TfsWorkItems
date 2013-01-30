﻿(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }

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
    
    app.addEventListener(Data.processingEvent, showProcessing);
    WinJS.Navigation.addEventListener("navigated", showProcessing);
    
    app.start();
    
    function showProcessing() {
        var topProgress = document.getElementById("topProgress");
        topProgress && (topProgress.style.display = Data.processingStatus ? "block" : "none");

        var processingMessage = document.getElementById("processingMessage");
        processingMessage && (processingMessage.textContent = Data.processingMessage);
    }
})();
