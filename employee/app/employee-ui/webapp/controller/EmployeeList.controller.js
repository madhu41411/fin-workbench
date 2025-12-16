sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("sap.employee.ui.controller.EmployeeList", {
        onInit: function () {

        },

        onDownloadTemplate: function () {
            const header = "EMPLOYEE_ID,FIRST_NAME,LAST_NAME,EMAIL,DATE_OF_BIRTH,DEGREE,UNIVERSITY,GRADUATION_YEAR,EMP_STATUS_ID,STATUS_CHANGED_DATE";
            const sample = "101,John,Doe,john@example.com,1990-01-01,BSc,MIT,2012,1,2023-01-01";
            const csvContent = header + "\n" + sample;
            this._downloadFile(csvContent, "Employee_Template.csv");
        },

        onDownloadData: function () {
            const oModel = this.getView().getModel();
            const oContext = oModel.bindContext("/downloadEmployeeData(...)");

            oContext.execute().then(function () {
                const oResult = oContext.getBoundContext().getObject();
                if (oResult && oResult.value) {
                    this._downloadFile(oResult.value, "Employee_Data.csv");
                } else {
                    MessageToast.show("No data to download");
                }
            }.bind(this)).catch(function (oError) {
                MessageBox.error("Download failed: " + oError.message);
            });
        },

        onFileChange: function (oEvent) {
            const oFileUploader = oEvent.getSource();
            const oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];

            if (oFile) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const content = e.target.result;
                    this._uploadData(content);
                }.bind(this);
                reader.readAsText(oFile);
            }
            // Clear to allow re-upload of same file
            oFileUploader.clear();
        },

        _uploadData: function (content) {
            const oModel = this.getView().getModel();
            const oContext = oModel.bindContext("/uploadEmployeeData(...)");

            oContext.setParameter("content", content);

            oContext.execute().then(function () {
                const oResult = oContext.getBoundContext().getObject();
                MessageToast.show(oResult.value || "Upload Successful");
                this.getView().byId("employeeTable").getBinding("items").refresh();
            }.bind(this)).catch(function (oError) {
                MessageBox.error("Upload failed: " + oError.message);
            });
        },

        _downloadFile: function (content, fileName) {
            const blob = new Blob([content], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    });
});
