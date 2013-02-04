(function () {
    "use strict";

    var WebDataService = WinJS.Class.define(

        // constructor
        function (apiBaseUrl) {
            this.apiBaseUrl = apiBaseUrl;
        },
        
        // instance members
        {
            currentProjectUri: null,
            currentWorkItemList: null,
            currentPageNumber: 0,
            currentWorkItemType: "All",
            
            // Populates projectList with data from the TFS proxy service
            getTeamProjects: function (list) {
                var self = this;
                
                list.dataSource.beginEdits();
                while (list.length > 0) {
                    list.pop();
                }

                if (!Settings.tfsUrl) {
                    list.dataSource.endEdits();
                    Data.processingMessage = "Please open the Settings charm, select Connection, and enter your TFS server URL.";
                    return;
                }

                Data.raiseProcessing(true, "Retrieving Team Projects list...");

                WinJS.xhr({
                    type: "GET",
                    url: self.apiBaseUrl + "/api/projects",
                    headers: { TfsUrl: Settings.tfsUrl }
                })
                .done(
                    function (result) {
                        Data.raiseProcessing(false);
                        try {
                            var responseJson = JSON.parse(result.responseText);
                            responseJson.forEach(function (project) {
                                list.push(project);
                            });
                            list.dataSource.endEdits();
                        } catch (e) {
                            var msgDialog = new Windows.UI.Popups.MessageDialog("Error parsing service result.");
                            msgDialog.showAsync();
                        }
                    },
                    function (result) {
                        Data.raiseProcessing(false);
                        var resultMessage = "Error connecting to TFS.";

                        if (result.responseText && result.responseText !== "") {
                            try {
                                var responseJson = JSON.parse(result.responseText);
                                resultMessage += "\r\n" + result.statusText + " - " + responseJson.Message;
                            } catch (e) {
                            }
                        }

                        var msgDialog = new Windows.UI.Popups.MessageDialog(resultMessage);
                        msgDialog.showAsync();
                    }
                );
            },

            getWorkItems: function (project, pageNumber, workItemTypeFilter) {
                var self = this;
                if (self.currentProjectUri === project.ProjectUri &&
                    self.currentPageNumber === pageNumber &&
                    self.currentWorkItemType === workItemTypeFilter
                ) {
                    return new WinJS.Promise(function (complete) {
                        complete(self.currentWorkItemList);
                    });
                }
        
                Data.raiseProcessing(true, "Getting Work Items...");

                return new WinJS.Promise(function (complete, error, progress) {
                    var workItemList = new WinJS.Binding.List();

                    var urlWithParams = self.apiBaseUrl + "/api/workitems?" +
                        WebDataService.formatQueryString({
                            collectionId: project.CollectionId,
                            projectName: project.ProjectName,
                            page: pageNumber,
                            workItemType: workItemTypeFilter
                        });

                    WinJS.xhr({
                        type: "GET",
                        url: urlWithParams,
                        headers: { TfsUrl: Settings.tfsUrl }
                    })
                    .then(
                        function (result) {
                            var responseJson = JSON.parse(result.responseText);
                            responseJson.forEach(function (workItem) {
                                workItemList.push(workItem);
                            });
                            self.currentPageNumber = pageNumber;
                            self.currentWorkItemList = workItemList;
                            self.currentProjectUri = project.ProjectUri;
                        },
                        function (result) {
                            var msgDialog = new Windows.UI.Popups.MessageDialog("Error fetching work items.");
                            msgDialog.showAsync();
                        })
                    .done(
                        function () {
                            Data.raiseProcessing(false);
                            complete(workItemList);
                        });
                });
            }
        },
        
        // static members
        {
            getProjectGroupKey: function (dataItem) {
                return dataItem.CollectionName;
            },

            getProjectGroupData: function (dataItem) {
                return dataItem.CollectionName;
            },

            compareProjectGroups: function (left, right) {
                return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
            },
            
            formatQueryString: function(params) {
                var queryString = "";
                for (var propertyName in params) {
                    var propertyValue = params[propertyName];
                    queryString += propertyName + "=" + encodeURIComponent(propertyValue) + "&";
                }
                return queryString.slice(0, -1);
            }
        }
    );
    
    var SampleDataService = WinJS.Class.define(
        function() {},
        {},
        {
            getTeamProjects: function(list) {
                var sampleProjects = [
                    {
                        "CollectionName": "TestColl1",
                        "CollectionId": "D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "ProjectName": "TestProject1",
                        "ProjectUri": "vstfs:///Classification/TeamProject/D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "WorkItemTypes": ["Bug", "Requirement", "User Story"]
                    },
                    {
                        "CollectionName": "TestColl1",
                        "CollectionId": "D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "ProjectName": "TestProject2",
                        "ProjectUri": "vstfs:///Classification/TeamProject/D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "WorkItemTypes": ["Bug", "Requirement", "User Story"]
                    },
                    {
                        "CollectionName": "TestColl1",
                        "CollectionId": "D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "ProjectName": "TestProject3",
                        "ProjectUri": "vstfs:///Classification/TeamProject/D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "WorkItemTypes": ["Bug", "Requirement", "User Story"]
                    },
                    {
                        "CollectionName": "TestColl2",
                        "CollectionId": "D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "ProjectName": "TestProject4",
                        "ProjectUri": "vstfs:///Classification/TeamProject/D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "WorkItemTypes": ["Bug", "Requirement", "User Story"]
                    },
                    {
                        "CollectionName": "TestColl2",
                        "CollectionId": "D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "ProjectName": "TestProject5",
                        "ProjectUri": "vstfs:///Classification/TeamProject/D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "WorkItemTypes": ["Bug", "Requirement", "User Story"]
                    },
                    {
                        "CollectionName": "TestColl3",
                        "CollectionId": "D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "ProjectName": "TestProject6",
                        "ProjectUri": "vstfs:///Classification/TeamProject/D89C3EF8-6DC0-4763-8B4E-58F939710CBB",
                        "WorkItemTypes": ["Bug", "Requirement", "User Story"]
                    },
                ];

                sampleProjects.forEach(function(project) {
                    list.push(project);
                });
            },

            getWorkItems: function(project, pageNumber, workItemTypeFilter) {
                return new WinJS.Promise(function(complete, error, progress) {
                    Data.raiseProcessing(true, "Getting work items...");

                    var sampleWorkItems = [
                        {
                            "Id": 67,
                            "Title": "A very important Project",
                            "AssignedTo": "John Smith",
                            "Description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus ac dui at nulla molestie sollicitudin. Curabitur lorem eros, fringilla at ultrices eget, mollis ornare nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam magna leo, porta at pulvinar et, fringilla sit amet sem. Nunc justo eros, molestie eu tempor quis, mollis eu dui. Cras nec ipsum orci, ac dignissim elit. Suspendisse nunc libero, commodo at luctus ut, ultricies sed eros. Nullam et libero enim, non semper neque. Nunc placerat elementum sapien nec euismod. Sed vel sollicitudin odio. Ut suscipit lobortis molestie. Proin in odio a nibh eleifend tempus ac id nisl. Aliquam libero urna, consectetur sed ultricies in, auctor ut lacus. Vestibulum sollicitudin ultrices odio, eget imperdiet velit rutrum at. Pellentesque cursus quam sit amet tellus bibendum semper ut vel leo. Duis non sollicitudin turpis. Duis lobortis, nisl nec commodo rutrum, nunc felis pretium orci, mattis porta orci enim malesuada purus. Nunc eget massa nec ligula dictum aliquet ut iaculis sapien. Morbi vehicula aliquam mauris. Curabitur accumsan aliquam bibendum. In vestibulum condimentum sodales. Suspendisse potenti. Etiam ornare hendrerit nulla, vel placerat ipsum congue at. Nunc sit amet commodo quam. Donec eu arcu a elit tristique fermentum. Sed hendrerit metus a urna malesuada blandit. Nullam hendrerit venenatis risus a dictum. Pellentesque a risus sed velit pellentesque pulvinar quis sodales justo. Nulla dapibus mollis elit ut iaculis. Nunc ac dapibus lectus. Donec vitae augue diam. Suspendisse id nunc ligula, eu luctus massa. Nulla eu faucibus nisl. Aenean fermentum velit ac tellus commodo varius. Nunc molestie ultrices enim at faucibus. Nulla orci elit, ornare ac consectetur id, dignissim et nibh. Fusce non odio quam. Duis sit amet lectus dui. Nunc vel urna ante. Aliquam felis orci, faucibus ac molestie quis, gravida nec augue. Sed viverra augue at ligula lobortis at pharetra eros mattis. Phasellus consequat leo ut est malesuada id venenatis purus rhoncus. Aliquam elementum diam at nunc rhoncus placerat. Donec fringilla libero in metus mollis auctor. Morbi turpis lacus, aliquet ut malesuada id, ultrices a orci. In tincidunt, leo elementum tincidunt viverra, tortor ligula posuere magna, vel iaculis quam metus pulvinar massa. Vestibulum id felis eget lacus ullamcorper faucibus at nec purus. Fusce malesuada nisi id nibh dignissim ut placerat lacus egestas. Nunc ac nisi et odio mattis rhoncus et vitae ante. Vivamus in tortor sapien. Aenean convallis dictum molestie. Morbi a laoreet nisi. Sed velit nulla, dictum vehicula placerat quis, viverra ac metus.",
                            "WorkItemType": "Project",
                            "State": "Viable",
                            "Reason": "New",
                            "Area": "Project\Area\Path",
                            "Iteration": "Project\Iteration\Path",
                            "History": "Scrum Aggregation Service - A21 - Summation of the ESTIMATED hours for the Project. - A22 - Summation of the COMPLETED hours for the Project. - A23 - Summation of the REMAINING hours for the Project.",
                            "CreatedDate": "2012-03-19T10:38:50.733-07:00",
                            "ChangedDate": "2012-03-19T10:41:01.983-07:00",
                            "OtherFields": [
                                {
                                    "Name": "Title",
                                    "Value": ""
                                },
                                {
                                    "Name": "State",
                                    "Value": "Viable"
                                },
                                {
                                    "Name": "Rev",
                                    "Value": "2"
                                },
                                {
                                    "Name": "Changed By",
                                    "Value": "TFS2010Service"
                                },
                                {
                                    "Name": "Reason",
                                    "Value": "New"
                                },
                                {
                                    "Name": "Assigned To",
                                    "Value": ""
                                },
                                {
                                    "Name": "Work Item Type",
                                    "Value": "Project"
                                },
                                {
                                    "Name": "Created Date",
                                    "Value": "3/19/2012 10:38:50 AM"
                                },
                                {
                                    "Name": "Created By",
                                    "Value": "John Alexander"
                                },
                                {
                                    "Name": "Template Version",
                                    "Value": "5.1.3"
                                },
                                {
                                    "Name": "Remaining Work",
                                    "Value": "0"
                                },
                                {
                                    "Name": "Description",
                                    "Value": ""
                                },
                                {
                                    "Name": "History",
                                    "Value": "Scrum Aggregation Service - A21 - Summation of the ESTIMATED hours for the Project. - A22 - Summation of the COMPLETED hours for the Project. - A23 - Summation of the REMAINING hours for the Project."
                                },
                                {
                                    "Name": "Related Link Count",
                                    "Value": "0"
                                },
                                {
                                    "Name": "History Date",
                                    "Value": "3/19/2012 10:41:01 AM"
                                },
                                {
                                    "Name": "Planned Velocity",
                                    "Value": "0"
                                },
                                {
                                    "Name": "Project Name",
                                    "Value": "Test Project"
                                },
                                {
                                    "Name": "Office",
                                    "Value": ""
                                },
                                {
                                    "Name": "Project Manager",
                                    "Value": ""
                                },
                                {
                                    "Name": "Actual Work",
                                    "Value": "0"
                                },
                                {
                                    "Name": "boolTestPlan",
                                    "Value": "No"
                                },
                                {
                                    "Name": "boolEngagementPlan",
                                    "Value": "No"
                                },
                                {
                                    "Name": "boolCharter",
                                    "Value": "No"
                                },
                                {
                                    "Name": "Project Tiers",
                                    "Value": "Consulting / MDC"
                                },
                                {
                                    "Name": "WO review",
                                    "Value": "No"
                                },
                                {
                                    "Name": "Internal Kickoff",
                                    "Value": "No"
                                },
                                {
                                    "Name": "ClientKickoff",
                                    "Value": "No"
                                },
                                {
                                    "Name": "Worksite Ready",
                                    "Value": "No"
                                },
                                {
                                    "Name": "CSAT to Marketing",
                                    "Value": "No"
                                },
                                {
                                    "Name": "Hyperlink Count",
                                    "Value": "0"
                                },
                                {
                                    "Name": "Attached File Count",
                                    "Value": "0"
                                },
                                {
                                    "Name": "Revised Date",
                                    "Value": "1/1/9999 12:00:00 AM"
                                },
                                {
                                    "Name": "Changed Date",
                                    "Value": "3/19/2012 10:41:01 AM"
                                },
                                {
                                    "Name": "ID",
                                    "Value": "67"
                                },
                                {
                                    "Name": "Area ID",
                                    "Value": "22"
                                },
                                {
                                    "Name": "Authorized As",
                                    "Value": ""
                                }
                            ]
                        },
                        {
                            Id: 2,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 3,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 4,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 5,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 6,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 7,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 8,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 9,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 10,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 11,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 12,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 13,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 14,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 15,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 16,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 17,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 18,
                            Title: "Work Item 2",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 19,
                            Title: "Work Item 19",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        },
                        {
                            Id: 20,
                            Title: "Work Item 20",
                            Description: "Four score and seven years",
                            AssignedTo: "Susan Fredericks",
                            WorkItemType: "Requirement",
                            State: "Active"
                        }
                    ];

                    var workItemList = new WinJS.Binding.List();
                    sampleWorkItems.slice(pageNumber * 10).forEach(function(workItem) {
                        workItemList.push(workItem);
                    });

                    setTimeout(function() {
                        Data.raiseProcessing(false);
                        complete(workItemList);
                    }, 1000);
                });
            }
        });
    
    var
        projectList = new WinJS.Binding.List(),
        designMode = Windows.ApplicationModel.DesignMode.designModeEnabled,
        webDataService = new WebDataService("https://teststepseditor.apphb.com");

    WinJS.Namespace.define("Data", {
        projects: projectList,
        groupedProjects: projectList.createGrouped(WebDataService.getProjectGroupKey, WebDataService.getProjectGroupData, WebDataService.compareProjectGroups),
        dataService: designMode? SampleDataService : webDataService,
        processingEvent: "processingEvent",
        processingStatus: false,
        processingMessage: "",
        loadProjects: function () {
            this.dataService.getTeamProjects(this.projects);
        },
        raiseProcessing: function (value, message) {
            this.processingStatus = value;
            this.processingMessage = message || "";
            WinJS.Application.queueEvent({ type: Data.processingEvent, processing: value });
        }
    });

    Data.loadProjects();
    
})();
