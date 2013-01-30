(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var ui = WinJS.UI;

    ui.Pages.define("/pages/items/items.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            
            this._setNoConnText();
            
            var listView = element.querySelector(".itemslist").winControl;
            listView.itemDataSource = Data.groupedProjects.dataSource;
            listView.groupDataSource = Data.groupedProjects.groups.dataSource;
            listView.itemTemplate = element.querySelector(".itemtemplate");
            listView.oniteminvoked = this._itemInvoked.bind(this);
            
            // TODO: these two handlers should instead listen to an event
            //       off of Data.statuschanged - can have values of
            //       No Connection, Connecting, Connected
            
            Data.projects.oniteminserted = function (eventInfo) {
                if (eventInfo.detail.index === 0) {
                    document.getElementById("no-connection").style.display = "none";
                }
            };
            
            Data.projects.onitemremoved = (function (eventInfo) {
                if (eventInfo.detail.index === 0) {
                    var noConnection = document.getElementById("no-connection");
                    noConnection.style.display = "block";
                    this._setNoConnText();
                }
            }).bind(this);

            this._initializeLayout(listView, Windows.UI.ViewManagement.ApplicationView.value);
            listView.element.focus();
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = element.querySelector(".itemslist").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    };
                    listView.addEventListener("contentanimating", handler, false);
                    var firstVisible = listView.indexOfFirstVisible;
                    this._initializeLayout(listView, viewState);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                }
            }
        },
        
        _setNoConnText: function() {
            var noConnection = document.getElementById("no-connection");
            if (Data.projects.length > 0) {
                noConnection.style.display = "none";
            }
            else {
                noConnection.style.display = "block";
                noConnection.textContent = (Settings.tfsUrl)
                    ? "Attempting to load project list..."
                    : "Please open the Settings charm, select Connection, and enter your TFS server URL.";
            }
        },

        // This function updates the ListView with new layouts
        _initializeLayout: function (listView, viewState) {
            /// <param name="listView" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped) {
                listView.layout = new ui.ListLayout();
            } else {
                listView.layout = new ui.GridLayout();
            }
        },

        _itemInvoked: function (args) {
            var project = Data.projects.getAt(args.detail.itemIndex);
            WinJS.Navigation.navigate("/pages/split/split.html", { project: project });
        }
    });
})();
