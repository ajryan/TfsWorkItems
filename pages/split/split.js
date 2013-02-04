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
        /// <field type="WinJS.Binding.List" />
        _otherFields: null,
        _project: null,
        _itemSelectionIndex: -1,
        _pageNumber: 0,
        _workItemTypeFilter: "All",

        ready: function (element, options) {
            var self = this;

            self._project = options ? options.project : {
                "CollectionName": "Team Collection",
                "CollectionId": "889d4b21-8b29-481c-bd25-ebf63193fc9a",
                "ProjectName": "Team Project",
                "ProjectUri": "vstfs:///Classification/TeamProject/f694cc49-94ff-44c2-bbaa-3396f5feb105",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            };

            self._itemSelectionIndex = (options && "selectedIndex" in options) ? options.selectedIndex : -1;

            element.querySelector("header[role=banner] .pagetitle").textContent = self._project.ProjectName;

            document.getElementById("cmdPrev").addEventListener("click", self._prevWorkItemPage.bind(this), false);
            document.getElementById("cmdNext").addEventListener("click", self._nextWorkItemPage.bind(this), false);
            document.getElementById("cmdFilter").addEventListener("click", function() {
                var flyOut = document.getElementById("filterFlyout").winControl;
                flyOut.show(this, "top");
            });
            
            // fill the work item type select with the available types and listen for selection
            var workItemTypeSelect = document.getElementById("workItemTypeSelect");
            self._project.WorkItemTypes.forEach(function (workItemType) {
                var option = document.createElement("option");
                option.textContent = workItemType;
                option.value = workItemType;
                workItemTypeSelect.add(option);
            });
            workItemTypeSelect.onchange = function (event) {
                var currentValue = this.value;
                self._pageNumber = 0;
                this._itemSelectionIndex = -1;
                self._workItemTypeFilter = currentValue;
                document.getElementById("appbar").winControl.hide();
                self._getWorkItems();
            };
            
            var workItemListViewport = element.querySelector(".workitem-list .win-viewport");
            workItemListViewport.onscroll = function (event) {
                // when scrolled to the bottom, show the appbar to indicate ability to page
                if (this.scrollTop == (this.scrollHeight - this.offsetHeight)) {
                    document.getElementById("appbar").winControl.show();
                }
            };
            
            self._getWorkItems();
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = element.querySelector(".workitem-list").winControl;
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
                    element.querySelector(".workitem-detail-section").focus();
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

        _getWorkItems: function() {
            var self = this;
        
            // fade list and workitem while loading
            WinJS.UI.Animation.fadeOut([[document.querySelector(".workitem-detail-section")], [document.querySelector(".workitem-list-section")]]);
            
            var listView = document.querySelector(".workitem-list").winControl;

            Data.dataService.getWorkItems(self._project, self._pageNumber, self._workItemTypeFilter).then(function (workItems) {
                self._workItems = workItems;
                
                // Set up the work item ListView.
                listView.itemDataSource = self._workItems.dataSource;
                listView.itemTemplate = document.querySelector(".workitem-template");
                listView.onselectionchanged = self._selectionChanged.bind(self);
                listView.layout = new ui.ListLayout();

                self._updateVisibility();

                if (self._isSingleColumn()) {
                    if (self._itemSelectionIndex >= 0) {
                        // for single-column detail view, load the article and change page title to Work Item title
                        self._loadArticleDetails();
                        WinJS.UI.Animation.fadeIn([[document.querySelector(".workitem-detail-section")], [document.querySelector(".workitem-list-section")]]);
                    }
                } else {
                    if (nav.canGoBack && nav.history.backStack[nav.history.backStack.length - 1].location === "/pages/split/split.html") {
                        // Clean up the backstack to handle a user snapping, navigating
                        // away, unsnapping, and then returning to this page.
                        nav.history.backStack.pop();
                    }
                    // If this page has a selectionIndex, make that selection appear in the ListView.
                    listView.selection.set(Math.max(self._itemSelectionIndex, 0));
                    WinJS.UI.Animation.fadeIn(document.querySelector(".workitem-list-section")); // selection change did enterContent on the workitem-detail-section
                }
            });
            
        },
        
        _prevWorkItemPage: function () {
            document.getElementById("appbar").winControl.hide();
            this._itemSelectionIndex = -1;
            this._pageNumber = Math.max(0, this._pageNumber - 1);
            this._getWorkItems();
        },

        _nextWorkItemPage: function () {
            document.getElementById("appbar").winControl.hide();
            this._itemSelectionIndex = -1;
            this._pageNumber++;
            this._getWorkItems();
        },
        
        // This function checks if the list and details columns should be displayed
        // on separate pages instead of side-by-side.
        _isSingleColumn: function () {
            var viewState = Windows.UI.ViewManagement.ApplicationView.value;
            return (viewState === appViewState.snapped || viewState === appViewState.fullScreenPortrait);
        },

        _selectionChanged: function (args) {
            var listView = document.body.querySelector(".workitem-list").winControl;
            var self = this;
            listView.selection.getItems().done(function updateDetails(items) {
                if (items.length > 0) {
                    self._itemSelectionIndex = items[0].index;
                    if (self._isSingleColumn()) {
                        // If snapped or portrait, navigate to a new page containing the
                        // selected item's details.
                        nav.navigate("/pages/split/split.html", { project: self._project, selectedIndex: self._itemSelectionIndex });
                    } else {
                        // If fullscreen or filled, update the details column with new data.
                        WinJS.UI.Animation.exitPage(document.querySelector(".workitem-detail-section"));
                        self._loadArticleDetails();
                        WinJS.UI.Animation.enterPage(document.querySelector(".workitem-detail-section"));
                    }
                }
            });
        },

        _loadArticleDetails: function () {
            var workItem = this._workItems.getAt(this._itemSelectionIndex);

            // in single-column, show the work item title as page title
            if (this._isSingleColumn()) {
                var pageTitle = workItem.Title;
                document.querySelector("header[role=banner] .pagetitle").textContent = pageTitle;
            }
            
            // special case for Description and History with HTML content
            var descriptionDiv = document.querySelector(".workitem-description");
            if (workItem.Description.toLowerCase().indexOf("</p>") > -1) {
                descriptionDiv.innerHTML = window.toStaticHTML(workItem.Description);
            } else {
                descriptionDiv.textContent = workItem.Description;
            }
            var historyDiv = document.querySelector(".workitem-history");
            historyDiv.textContent = window.toStaticHTML(workItem.History);

            // re-bind other fields list with currently-selected work item
            var otherFieldsList = document.querySelector(".workitem-field-list").winControl;
            otherFieldsList.layout = new ui.ListLayout();
            otherFieldsList.itemTemplate = document.querySelector(".field-template");
            this._otherFields = new WinJS.Binding.List(workItem.OtherFields);
            otherFieldsList.itemDataSource = this._otherFields.dataSource;

            var articleDiv = document.querySelector(".workitem-detail-section");
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
                    utils.addClass(document.querySelector(".workitem-detail-section"), "primarycolumn");
                    document.querySelector(".workitem-detail-section").focus();
                } else {
                    utils.addClass(document.querySelector(".workitem-list-section"), "primarycolumn");
                    document.querySelector(".workitem-list").focus();
                }
            } else {
                document.querySelector(".workitem-list").focus();
            }
        }
    });
})();
