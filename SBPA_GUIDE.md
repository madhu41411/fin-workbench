# How to Create an Invoice Matching Process in SAP Build Process Automation

Since I cannot log in to your secure SAP BTP environment, I have prepared this step-by-step guide to help you create the process yourself.

## 1. Access SAP Build Lobby
1.  Log in to [SAP Build Lobby](https://dc6127cdtrial.us10.build.cloud.sap/lobby).
2.  Click **Create** button.
3.  Select **Build an Automated Process**.
4.  Select **Business Process**.
5.  Give it a name (e.g., "Invoice Matching Process") and click **Create**.

## 2. Define the Trigger
1.  In the "How do you want to start your process?" dialog (as shown in your screenshot), select **Submit a Form**.
2.  Click **Create**.
3.  Name the trigger form (e.g., "Invoice Submission Form").
4.  **Design the Form**:
    *   Click on the three dots `...` on the form trigger and select **Open Editor**.
    *   Add fields for the invoice data:
        *   **Vendor Name** (Text)
        *   **Invoice Amount** (Number)
        *   **PO Number** (Text)
        *   **Invoice Date** (Date)
    *   Save the form.

## 3. Add Decision Rules (Maintainable Rules)
To make the rules maintainable, we will use a **Decision**.

1.  Go back to the **Process Builder**.
2.  Click the **+** button after the Trigger.
3.  Select **Decision** -> **Create New Decision**.
4.  Name it "Invoice Matching Rules".
5.  **Open the Decision Editor**:
    *   **Input Data**: Define inputs matching your form (Vendor, Amount, PO Number).
    *   **Output Data**: Define output (e.g., `MatchingStatus` [String], `ApprovalGroup` [String]).
6.  **Create a Rule**:
    *   Click **Rules** -> **Add Rule**.
    *   Create a **Decision Table**.
    *   **Conditions (If)**:
        *   `Amount <= 1000`
        *   `Vendor == "Trusted Vendor"`
    *   **Results (Then)**:
        *   `MatchingStatus = "Auto-Matched"`
    *   Add another row for exceptions:
        *   `Amount > 1000`
        *   `MatchingStatus = "Approval Required"`
        *   `ApprovalGroup = "Manager"`

## 4. Add Process Logic
1.  Go back to the **Process Builder**.
2.  Click **+** after the Decision step.
3.  Select **Control** -> **Condition**.
4.  **Configure Condition**:
    *   If `MatchingStatus` (from Decision output) is equal to `"Auto-Matched"`.
5.  **True Path (Auto-Match)**:
    *   Add an **Action** to update the backend (e.g., call your CAP service `postToSAP` action).
    *   Or add a **Notification** email.
6.  **False Path (Approval)**:
    *   Add an **Approval** form.
    *   Assign it to the `ApprovalGroup` determined by the rules.

## 5. Release and Deploy
1.  Click **Release** (top right) to version the project.
2.  Click **Deploy** to make it active in your subaccount.

## Note on Integration
To connect this process with your **Finance Workbench** (CAP app):
1.  You can trigger this process via API from your CAP app instead of a manual form.
2.  Or, you can keep the logic entirely within your CAP app using the `Invoice Matcher` module we deployed, which might be faster for high-volume matching.
