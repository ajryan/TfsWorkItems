(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var binding = WinJS.Binding;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    ui.Pages.define("/pages/split/split.html", {

        /// <field type="WinJS.Binding.List" />
        _workItems: null,
        _project: null,
        _itemSelectionIndex: -1,
        _otherFields: new WinJS.Binding.List(),
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var self = this;
            var listView = element.querySelector(".itemlist").winControl;

            // Store information about the group and selection that this page will
            // display.
            self._project = options ? options.project : {
                "CollectionName": "Magenic",
                "CollectionId": "889d4b21-8b29-481c-bd25-ebf63193fc9a",
                "ProjectName": "Magenic - ChicagoTablet",
                "ProjectUri": "vstfs:///Classification/TeamProject/f694cc49-94ff-44c2-bbaa-3396f5feb105"
            };

            self._itemSelectionIndex = (options && "selectedIndex" in options) ? options.selectedIndex : -1;

            element.querySelector("header[role=banner] .pagetitle").textContent = self._project.ProjectName;

            Data.getWorkItemsFromProject(self._project).done(function (workItems) {
                self._workItems = workItems;

                // Set up the work item ListView.
                listView.itemDataSource = self._workItems.dataSource;
                listView.itemTemplate = element.querySelector(".itemtemplate");
                listView.onselectionchanged = self._selectionChanged.bind(self);
                listView.layout = new ui.ListLayout();

                // Set up the other fields ListView.
                var otherFieldsList = document.querySelector(".article-field-list").winControl;
                otherFieldsList.layout = new ui.ListLayout();
                otherFieldsList.itemTemplate = document.querySelector(".fieldtemplate");

                self._updateVisibility();

                if (self._isSingleColumn()) {
                    // Single-column
                    if (self._itemSelectionIndex >= 0) {
                        // For single-column detail view, load the article and change page title to Work Item title
                        self._loadArticleDetails();
                    }
                } else {
                    if (nav.canGoBack && nav.history.backStack[nav.history.backStack.length - 1].location === "/pages/split/split.html") {
                        // Clean up the backstack to handle a user snapping, navigating
                        // away, unsnapping, and then returning to this page.
                        nav.history.backStack.pop();
                    }
                    // If this page has a selectionIndex, make that selection
                    // appear in the ListView.
                    listView.selection.set(Math.max(self._itemSelectionIndex, 0));
                }

            });
        },

        unload: function () {
            // TODO: not supported? should be WinJS.Binding.List
            //this._workItems.dispose();
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = element.querySelector(".itemlist").winControl;
            var firstVisible = listView.indexOfFirstVisible;
            this._updateVisibility();

            var handler = function (e) {
                listView.removeEventListener("contentanimating", handler, false);
                e.preventDefault();
            };

            if (this._isSingleColumn()) {
                listView.selection.clear();
                if (this._itemSelectionIndex >= 0) {
                    // If the app has snapped into a single-column detail view,
                    // add the single-column list view to the backstack.
                    nav.history.current.state = {
                        project: this._project,
                        selectedIndex: this._itemSelectionIndex
                    };
                    nav.history.backStack.push({
                        location: "/pages/split/split.html",
                        state: { project: this._project }
                    });
                    element.querySelector(".articlesection").focus();
                } else {
                    listView.addEventListener("contentanimating", handler, false);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                    listView.forceLayout();
                }
            } else {
                // If the app has unsnapped into the two-column view, remove any
                // splitPage instances that got added to the backstack.
                if (nav.canGoBack && nav.history.backStack[nav.history.backStack.length - 1].location === "/pages/split/split.html") {
                    nav.history.backStack.pop();
                }
                if (viewState !== lastViewState) {
                    listView.addEventListener("contentanimating", handler, false);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                    listView.forceLayout();
                }

                listView.selection.set(this._itemSelectionIndex >= 0 ? this._itemSelectionIndex : Math.max(firstVisible, 0));
            }
        },

        // This function checks if the list and details columns should be displayed
        // on separate pages instead of side-by-side.
        _isSingleColumn: function () {
            var viewState = Windows.UI.ViewManagement.ApplicationView.value;
            return (viewState === appViewState.snapped || viewState === appViewState.fullScreenPortrait);
        },

        _selectionChanged: function (args) {
            var listView = document.body.querySelector(".itemlist").winControl;
            var self = this;
            // By default, the selection is restricted to a single item.
            listView.selection.getItems().done(function updateDetails(items) {
                if (items.length > 0) {
                    self._itemSelectionIndex = items[0].index;
                    if (self._isSingleColumn()) {
                        // If snapped or portrait, navigate to a new page containing the
                        // selected item's details.
                        nav.navigate("/pages/split/split.html", { project: self._project, selectedIndex: self._itemSelectionIndex });
                    } else {
                        // If fullscreen or filled, update the details column with new data.
                        self._loadArticleDetails();
                    }
                }
            });
        },

        _loadArticleDetails: function () {
            var workItem = this._workItems.getAt(this._itemSelectionIndex);

            // in single-column, show the work item title as 
            if (this._isSingleColumn()) {
                var pageTitle = workItem.Title;
                document.querySelector("header[role=banner] .pagetitle").textContent = pageTitle;
            }
            
            var articleDiv = document.querySelector(".articlesection");

            // special case for Description and History with HTML content
            var descriptionDiv = document.querySelector(".article-content");
            if (workItem.Description.toLowerCase().indexOf("</p>") > -1) {
                descriptionDiv.innerHTML = window.toStaticHTML(workItem.Description);
            } else {
                descriptionDiv.textContent = workItem.Description;
            }
            var historyDiv = document.querySelector(".workitem-history");
            historyDiv.textContent = window.toStaticHTML(workItem.History);

            // re-bind other fields list with currently-selected work item
            var fieldListView = document.querySelector(".article-field-list").winControl;
            this._otherFields = new WinJS.Binding.List(workItem.OtherFields);
            fieldListView.itemDataSource = this._otherFields.dataSource;

            binding.processAll(articleDiv, workItem);

            articleDiv.scrollTop = 0;
        },
        // This function toggles visibility of the two columns based on the current
        // view state and item selection.
        _updateVisibility: function () {
            var oldPrimary = document.querySelector(".primarycolumn");
            if (oldPrimary) {
                utils.removeClass(oldPrimary, "primarycolumn");
            }
            if (this._isSingleColumn()) {
                if (this._itemSelectionIndex >= 0) {
                    utils.addClass(document.querySelector(".articlesection"), "primarycolumn");
                    document.querySelector(".articlesection").focus();
                } else {
                    utils.addClass(document.querySelector(".itemlistsection"), "primarycolumn");
                    document.querySelector(".itemlist").focus();
                }
            } else {
                document.querySelector(".itemlist").focus();
            }
        }
    });
})();
