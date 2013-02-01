(function () {
    "use strict";

    // TODO: inject API service URL from settings
    //var apiBaseUrl = "https://teststepseditor.apphb.com";
    var apiBaseUrl = "https://localhost:44300/";
    var projectList = new WinJS.Binding.List();
    var currentProjectUri = null;
    var currentWorkItemList = null;
    var currentPageNumber = 0;
    var currentWorkItemType = "All";
    
    var designMode = Windows.ApplicationModel.DesignMode.designModeEnabled;

    WinJS.Namespace.define("Data", {
        projects: projectList,
        groupedProjects: projectList.createGrouped(getProjectGroupKey, getProjectGroupData, compareProjectGroups),
        getProjects: getWebServiceProjects,
        getWorkItemsFromProject: designMode ? generateSampleWorkItems : getWorkItemsFromProject,
        processingEvent: "processingEvent",
        processingStatus: false,
        processingMessage: ""
    });
    
    if (designMode) {
        generateSampleProjectList();
    }
    else {
        getWebServiceProjects();
    }

    function getProjectGroupKey(dataItem) {
        return dataItem.CollectionName;
    }

    function getProjectGroupData(dataItem) {
        return dataItem.CollectionName;
    }

    function compareProjectGroups(left, right) {
        return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

    // Populates projectList with data from the TFS proxy service
    function getWebServiceProjects() {
        while (projectList.length > 0) {
            projectList.pop();
        }

        if (!Settings.tfsUrl) {
            Data.processingMessage = "Please open the Settings charm, select Connection, and enter your TFS server URL.";
            return;
        }

        raiseProcessing(true, "Retrieving Team Projects list...");

        WinJS.xhr({
            type: "GET",
            url: apiBaseUrl + "/api/projects",
            headers: { TfsUrl: Settings.tfsUrl }
        })
        .done(
            function (result) {
                raiseProcessing(false);
                try {
                    var responseJson = JSON.parse(result.responseText);
                    responseJson.forEach(function (project) {
                        projectList.push(project);
                    });
                } catch (e) {
                    var msgDialog = new Windows.UI.Popups.MessageDialog("Error parsing service result.");
                    msgDialog.showAsync();
                }
            },
            function (result) {
                raiseProcessing(false);
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
    }

    function getWorkItemsFromProject(project, pageNumber, workItemTypeFilter) {
        if (project.ProjectUri === currentProjectUri && currentPageNumber === pageNumber && currentWorkItemType === workItemTypeFilter) {
            return new WinJS.Promise(function (complete) {
                complete(currentWorkItemList);
            });
        }
        
        // TODO: some kind of caching, this gets hit every time
        //       the screen rotates or app is nav'd
        raiseProcessing(true, "Getting Work Items...");

        return new WinJS.Promise(function (complete, error, progress) {
            var workItemList = new WinJS.Binding.List();

            var urlWithParams =
                apiBaseUrl + "/api/workitems?collectionId=" +
                encodeURIComponent(project.CollectionId) +
                "&projectName=" +
                encodeURIComponent(project.ProjectName) +
                "&page=" +
                encodeURIComponent(pageNumber) +
                "&workItemType=" +
                encodeURIComponent(workItemTypeFilter);

            WinJS.xhr({
                type: "GET",
                url: urlWithParams,
                headers: { TfsUrl: Settings.tfsUrl }
            })
            .then(
                function (result) {
                    raiseProcessing(false);
                    var responseJson = JSON.parse(result.responseText);
                    responseJson.forEach(function (workItem) {
                        workItemList.push(workItem);
                    });
                    currentPageNumber = pageNumber;
                    currentWorkItemList = workItemList;
                    currentProjectUri = project.ProjectUri;
                },
                function (result) {
                    raiseProcessing(false);
                    var msgDialog = new Windows.UI.Popups.MessageDialog("Error fetching work items.");
                    msgDialog.showAsync();
                })
            .done(
                function () {
                    complete(workItemList);
                });
        });
    }

    function raiseProcessing(value, message) {
        Data.processingStatus = value;
        Data.processingMessage = message || "";
        WinJS.Application.queueEvent({ type: Data.processingEvent, processing: value });
    }

    function generateSampleWorkItems(project, pageNumber, workItemTypeFilter) {
        return new WinJS.Promise(function (complete, error, progress) {
            raiseProcessing(true, "Getting work items...");
            
            var sampleWorkItems = [
                {
                    "Id": 67,
                    "Title": "A very important Project",
                    "AssignedTo": "John Smith",
                    "Description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus ac dui at nulla molestie sollicitudin. Curabitur lorem eros, fringilla at ultrices eget, mollis ornare nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam magna leo, porta at pulvinar et, fringilla sit amet sem. Nunc justo eros, molestie eu tempor quis, mollis eu dui. Cras nec ipsum orci, ac dignissim elit. Suspendisse nunc libero, commodo at luctus ut, ultricies sed eros. Nullam et libero enim, non semper neque. Nunc placerat elementum sapien nec euismod. Sed vel sollicitudin odio. Ut suscipit lobortis molestie. Proin in odio a nibh eleifend tempus ac id nisl. Aliquam libero urna, consectetur sed ultricies in, auctor ut lacus. Vestibulum sollicitudin ultrices odio, eget imperdiet velit rutrum at. Pellentesque cursus quam sit amet tellus bibendum semper ut vel leo. Duis non sollicitudin turpis. Duis lobortis, nisl nec commodo rutrum, nunc felis pretium orci, mattis porta orci enim malesuada purus. Nunc eget massa nec ligula dictum aliquet ut iaculis sapien. Morbi vehicula aliquam mauris. Curabitur accumsan aliquam bibendum. In vestibulum condimentum sodales. Suspendisse potenti. Etiam ornare hendrerit nulla, vel placerat ipsum congue at. Nunc sit amet commodo quam. Donec eu arcu a elit tristique fermentum. Sed hendrerit metus a urna malesuada blandit. Nullam hendrerit venenatis risus a dictum. Pellentesque a risus sed velit pellentesque pulvinar quis sodales justo. Nulla dapibus mollis elit ut iaculis. Nunc ac dapibus lectus. Donec vitae augue diam. Suspendisse id nunc ligula, eu luctus massa. Nulla eu faucibus nisl. Aenean fermentum velit ac tellus commodo varius. Nunc molestie ultrices enim at faucibus. Nulla orci elit, ornare ac consectetur id, dignissim et nibh. Fusce non odio quam. Duis sit amet lectus dui. Nunc vel urna ante. Aliquam felis orci, faucibus ac molestie quis, gravida nec augue. Sed viverra augue at ligula lobortis at pharetra eros mattis. Phasellus consequat leo ut est malesuada id venenatis purus rhoncus. Aliquam elementum diam at nunc rhoncus placerat. Donec fringilla libero in metus mollis auctor. Morbi turpis lacus, aliquet ut malesuada id, ultrices a orci. In tincidunt, leo elementum tincidunt viverra, tortor ligula posuere magna, vel iaculis quam metus pulvinar massa. Vestibulum id felis eget lacus ullamcorper faucibus at nec purus. Fusce malesuada nisi id nibh dignissim ut placerat lacus egestas. Nunc ac nisi et odio mattis rhoncus et vitae ante. Vivamus in tortor sapien. Aenean convallis dictum molestie. Morbi a laoreet nisi. Sed velit nulla, dictum vehicula placerat quis, viverra ac metus.",
                    "WorkItemType": "Project",
                    "State": "Viable",
                    "Reason": "New",
                    "Area": "MagenicU-1",
                    "Iteration": "MagenicU-1",
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
                            "Value": "Andrew Kampa"
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
                            "Name": "Magenic Client Code",
                            "Value": ""
                        },
                        {
                            "Name": "Magenic Project Code",
                            "Value": ""
                        },
                        {
                            "Name": "Iteration Path",
                            "Value": "MagenicU-1"
                        },
                        {
                            "Name": "Iteration ID",
                            "Value": "22"
                        },
                        {
                            "Name": "External Link Count",
                            "Value": "0"
                        },
                        {
                            "Name": "Team Project",
                            "Value": "MagenicU-1"
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
                            "Name": "Node Name",
                            "Value": "MagenicU-1"
                        },
                        {
                            "Name": "Area Path",
                            "Value": "MagenicU-1"
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
            sampleWorkItems.slice(pageNumber * 10).forEach(function (workItem) {
                workItemList.push(workItem);
            });

            setTimeout(function() {
                raiseProcessing(false);
                complete(workItemList);
            }, 1000);
        });
    }

    function generateSampleProjectList() {
        var sampleProjects = [
            {
                "CollectionName": "Magenic",
                "CollectionId": "889d4b21-8b29-481c-bd25-ebf63193fc9a",
                "ProjectName": "Magenic - ChicagoTablet",
                "ProjectUri": "vstfs:///Classification/TeamProject/f694cc49-94ff-44c2-bbaa-3396f5feb105",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Magenic",
                "CollectionId": "889d4b21-8b29-481c-bd25-ebf63193fc9a",
                "ProjectName": "Magenic TFS Template",
                "ProjectUri": "vstfs:///Classification/TeamProject/eb03c322-de43-43c6-89f5-4f0a78e7f92c",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-1",
                "ProjectUri": "vstfs:///Classification/TeamProject/919b3352-4ee2-4437-a459-d9a5f9db95f4",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-2",
                "ProjectUri": "vstfs:///Classification/TeamProject/8efbee03-6cd5-4791-811c-ec8115683aa6",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-3",
                "ProjectUri": "vstfs:///Classification/TeamProject/97c989a4-ccd9-4649-8eb5-cfd9679ccf2c",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-4",
                "ProjectUri": "vstfs:///Classification/TeamProject/5b0ed9a1-55c9-4ce7-887c-23b684b828b0",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "Training 01",
                "ProjectUri": "vstfs:///Classification/TeamProject/3bcbf686-ca26-4dc3-9bf8-1cf1951dd60d",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 1",
                "ProjectUri": "vstfs:///Classification/TeamProject/3afcdcb7-0b08-42fa-a8ce-c68eddff76b6",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 2",
                "ProjectUri": "vstfs:///Classification/TeamProject/5aeed7e3-b896-47af-ad56-2835b8577bc1",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 3",
                "ProjectUri": "vstfs:///Classification/TeamProject/7002a859-5820-4544-8955-a4a42329f908",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 4",
                "ProjectUri": "vstfs:///Classification/TeamProject/18d80726-e3d1-45f7-a78f-689488ce5c15",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 5",
                "ProjectUri": "vstfs:///Classification/TeamProject/397fa5ca-f825-4b6e-9679-a3c17c253c7a",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "Source Space",
                "CollectionId": "c874ec4d-883f-4bbd-b924-62390511ec58",
                "ProjectName": "RockyL",
                "ProjectUri": "vstfs:///Classification/TeamProject/9f981f90-7e73-419f-9ece-c8978d7103dd",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            },
            {
                "CollectionName": "VISA",
                "CollectionId": "25ae8496-150f-40bf-8472-987ed04badd9",
                "ProjectName": "RealTimeMessaging",
                "ProjectUri": "vstfs:///Classification/TeamProject/1456b88f-01bc-4297-9b12-90a3b7faf5ff",
                "WorkItemTypes": ["Bug", "Requirement", "User Story"]
            }
        ];

        sampleProjects.forEach(function (project) {
            projectList.push(project);
        });
    }
})();
