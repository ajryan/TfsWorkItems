﻿(function () {
    "use strict";

    // TODO: inject API service URL from settings
    //var apiBaseUrl = "https://teststepseditor.apphb.com";
    var apiBaseUrl = "https://localhost:44300/";
    var projectList = new WinJS.Binding.List();

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

    function getWorkItemsFromProject(project) {
        // TODO: some kind of caching, this gets hit every time
        //       the screen rotates or app is nav'd
        raiseProcessing(true, "Getting Work Items...");

        return new WinJS.Promise(function (complete, error, progress) {
            var workItemList = new WinJS.Binding.List();

            var urlWithParams =
                apiBaseUrl + "/api/workitems?collectionId=" +
                encodeURIComponent(project.CollectionId) +
                "&projectName=" +
                encodeURIComponent(project.ProjectName);

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

    function generateSampleWorkItems(project) {
        return new WinJS.Promise(function (complete, error, progress) {
            var sampleWorkItems = [
                {
                    Id: 1,
                    Title: "Work Item 1",
                    Description: "Lorem ipsum stuff",
                    AssignedTo: "John Smith",
                    WorkItemType: "Bug",
                    State: "Assigned"
                },
                {
                    Id: 2,
                    Title: "Work Item 2",
                    Description: "Four score and seven years",
                    AssignedTo: "Susan Fredericks",
                    WorkItemType: "Requirement",
                    State: "Active"
                }
            ];

            var workItemList = new WinJS.Binding.List();
            sampleWorkItems.forEach(function (workItem) {
                workItemList.push(workItem);
            });

            complete(workItemList);
        });
    }

    function generateSampleProjectList() {
        var sampleProjects = [
            {
                "CollectionName": "Magenic",
                "CollectionId": "889d4b21-8b29-481c-bd25-ebf63193fc9a",
                "ProjectName": "Magenic - ChicagoTablet",
                "ProjectUri": "vstfs:///Classification/TeamProject/f694cc49-94ff-44c2-bbaa-3396f5feb105"
            },
            {
                "CollectionName": "Magenic",
                "CollectionId": "889d4b21-8b29-481c-bd25-ebf63193fc9a",
                "ProjectName": "Magenic TFS Template",
                "ProjectUri": "vstfs:///Classification/TeamProject/eb03c322-de43-43c6-89f5-4f0a78e7f92c"
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-1",
                "ProjectUri": "vstfs:///Classification/TeamProject/919b3352-4ee2-4437-a459-d9a5f9db95f4"
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-2",
                "ProjectUri": "vstfs:///Classification/TeamProject/8efbee03-6cd5-4791-811c-ec8115683aa6"
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-3",
                "ProjectUri": "vstfs:///Classification/TeamProject/97c989a4-ccd9-4649-8eb5-cfd9679ccf2c"
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "MagenicU-4",
                "ProjectUri": "vstfs:///Classification/TeamProject/5b0ed9a1-55c9-4ce7-887c-23b684b828b0"
            },
            {
                "CollectionName": "Magenic Training",
                "CollectionId": "f5960793-c152-443e-bc91-faec65e9c597",
                "ProjectName": "Training 01",
                "ProjectUri": "vstfs:///Classification/TeamProject/3bcbf686-ca26-4dc3-9bf8-1cf1951dd60d"
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 1",
                "ProjectUri": "vstfs:///Classification/TeamProject/3afcdcb7-0b08-42fa-a8ce-c68eddff76b6"
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 2",
                "ProjectUri": "vstfs:///Classification/TeamProject/5aeed7e3-b896-47af-ad56-2835b8577bc1"
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 3",
                "ProjectUri": "vstfs:///Classification/TeamProject/7002a859-5820-4544-8955-a4a42329f908"
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 4",
                "ProjectUri": "vstfs:///Classification/TeamProject/18d80726-e3d1-45f7-a78f-689488ce5c15"
            },
            {
                "CollectionName": "Project Center Sandbox",
                "CollectionId": "4d47a0df-7931-428d-b124-ddab1cc5f145",
                "ProjectName": "Chicago Training 5",
                "ProjectUri": "vstfs:///Classification/TeamProject/397fa5ca-f825-4b6e-9679-a3c17c253c7a"
            },
            {
                "CollectionName": "Source Space",
                "CollectionId": "c874ec4d-883f-4bbd-b924-62390511ec58",
                "ProjectName": "RockyL",
                "ProjectUri": "vstfs:///Classification/TeamProject/9f981f90-7e73-419f-9ece-c8978d7103dd"
            },
            {
                "CollectionName": "VISA",
                "CollectionId": "25ae8496-150f-40bf-8472-987ed04badd9",
                "ProjectName": "RealTimeMessaging",
                "ProjectUri": "vstfs:///Classification/TeamProject/1456b88f-01bc-4297-9b12-90a3b7faf5ff"
            }
        ];

        sampleProjects.forEach(function (project) {
            projectList.push(project);
        });
    }
})();
