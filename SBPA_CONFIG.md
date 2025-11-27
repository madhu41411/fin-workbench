# SBPA Integration Configuration Guide

##

 Environment Variables

Before deploying, you need to configure the following environment variables with your SBPA OAuth credentials.

### Local Development (.env file)

Create or update `/Users/madhukarreddy/CDS/bookshop/.env`:

```env
# SBPA Configuration
SBPA_API_URL=https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com
SBPA_AUTH_URL=https://dc6127cdtrial.authentication.us10.hana.ondemand.com/oauth/token
SBPA_CLIENT_ID=<your-oauth-client-id>
SBPA_CLIENT_SECRET=<your-oauth-client-secret>

# Application URL (for webhook callbacks)
APP_URL=https://dc6127cdtrial-dev-bookshop-srv.cfapps.us10-001.hana.ondemand.com
```

### Cloud Foundry Deployment

Set environment variables in your deployed app:

```bash
cf set-env bookshop-srv SBPA_CLIENT_ID "<your-client-id>"
cf set-env bookshop-srv SBPA_CLIENT_SECRET "<your-client-secret>"
cf set-env bookshop-srv SBPA_API_URL "https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com"
cf set-env bookshop-srv SBPA_AUTH_URL "https://dc6127cdtrial.authentication.us10.hana.ondemand.com/oauth/token"
cf set-env bookshop-srv APP_URL "https://dc6127cdtrial-dev-bookshop-srv.cfapps.us10-001.hana.ondemand.com"
cf restage bookshop-srv
```

## How to Get OAuth Credentials

You mentioned you have the OAuth credentials. Here's where they come from:

1. **SAP BTP Cockpit** → Your Subaccount → **Security** → **OAuth Clients**
2. Create a new OAuth client with scopes:
   - `workflow_instance_start`
   - `workflow_definition_read`
   - `workflow_instance_read`

3. Copy the **Client ID** and **Client Secret**.

## SBPA Process Definition ID

When you create your SBPA process in SAP Build, you'll get a **Process Definition ID** (looks like `mje-approval-process`).

You'll use this ID when calling the `sendToSBPA` action from the UI.

## Webhook Configuration in SBPA

In your SBPA process, configure the webhook to call back to Finance Workbench:

**Webhook URL**:
```
https://dc6127cdtrial-dev-bookshop-srv.cfapps.us10-001.hana.ondemand.com/sbpa/webhook/approval
```

**Payload** (from SBPA to send back):
```json
{
  "instanceId": "${context.workflowInstanceId}",
  "decision": "${context.approvalDecision}",
  "context": {
    "approver": "${context.approver}",
    "comments": "${context.comments}"
  }
}
```

## Testing the Integration

### 1. Local Testing (Optional)
```bash
cd /Users/madhukarreddy/CDS/bookshop
npm install
cds watch
```

### 2. Deploy to BTP
```bash
mbt build
cf deploy mta_archives/fin-workbench_1.0.0.mtar
```

### 3. Test from UI
1. Navigate to a Journal Entry details page
2. Click "Send for SBPA Approval" button (we'll add this next)
3. Enter your Process Definition ID
4. Check console logs for SBPA API call

### 4. Verify Webhook
When SBPA completes the approval, check:
- Database `SBPAService_ProcessInstances` for status
- MJE status updated to "Approved" or "Rejected"
- Workflow logs show SBPA callback

## Next: Add UI Button

Would you like me to add the "Send for SBPA Approval" button to the MJE Details page?
