# SAP Integration Suite Configuration Guide

## Quick Start

Your Finance Workbench now automatically posts approved journal entries to SAP!

**Current Mode**: Mock (generates fake document numbers)  
**To Enable Real API**: Configure environment variables below

## How It Works

### Automatic Flow (SBPA Approval)
```
1. User creates MJE → Sends to SBPA
2. SBPA approves
3. Webhook updates MJE status to "Approved"
4. 🆕 Webhook automatically posts to SAP via Integration Suite
5. SAP returns document number
6. MJE updated with document number
```

### Manual Flow (Direct Post)
```
1. User manually approves MJE
2. User clicks "Post to SAP" button
3. System posts to SAP via Integration Suite
4. SAP returns document number
```

## Environment Variables

### For Real SAP Integration Suite API

Configure these in Cloud Foundry:

```bash
# API Endpoint
cf set-env bookshop-srv SAP_IS_API_URL "https://your-tenant.cfapps.region.hana.ondemand.com/http/sap/journalentry"

# Choose one authentication method:

# Option 1: OAuth2
cf set-env bookshop-srv SAP_IS_AUTH_TYPE "oauth"
cf set-env bookshop-srv SAP_IS_TOKEN_URL "https://your-tenant.authentication.region.hana.ondemand.com/oauth/token"
cf set-env bookshop-srv SAP_IS_CLIENT_ID "your-client-id"
cf set-env bookshop-srv SAP_IS_CLIENT_SECRET "your-client-secret"

# Option 2: Basic Auth
cf set-env bookshop-srv SAP_IS_AUTH_TYPE "basic"
cf set-env bookshop-srv SAP_IS_USERNAME "your-username"
cf set-env bookshop-srv SAP_IS_PASSWORD "your-password"

# Option 3: API Key
cf set-env bookshop-srv SAP_IS_AUTH_TYPE "apikey"
cf set-env bookshop-srv SAP_IS_API_KEY "your-api-key"

# Restage after setting variables
cf restage bookshop-srv
```

## SAP API Payload Format

The system transforms Finance Workbench JE to this SAP format:

```json
{
  "CompanyCode": "1000",
  "DocumentDate": "2025-11-27",
  "PostingDate": "2025-11-27",
  "DocumentHeaderText": "Test Entry",
  "DocumentType": "SA",
  "DocumentReferenceID": "uuid",
  "to_JournalEntryItem": [
    {
      "ReferenceDocumentItem": "1",
      "GLAccount": "400000",
      "AmountInTransactionCurrency": 1000.00,
      "DebitCreditCode": "S",
      "CostCenter": "1000",
      "ProfitCenter": "",
      "ItemText": "Item description",
      "TransactionCurrency": "USD"
    }
  ]
}
```

**Note**: SAP uses `S` for Debit, `H` for Credit (not D/C)

If your SAP API expects a different format, edit `transformToSAPFormat()` in `srv/sap-is-integration.js`.

## Testing

### Test 1: Mock Mode (Current)
1. Create an MJE
2. Send to SBPA and approve
3. Check logs: `[SBPA Webhook] SAP IS API not configured, using mock mode`
4. MJE will have a document number starting with "5"

### Test 2: Real API Mode
1. Configure SAP IS credentials
2. Restage application
3. Create an MJE and approve via SBPA
4. Check logs: `[SBPA Webhook] Auto-posting MJE to SAP...`
5. Verify real document number from SAP
6. Verify in SAP: Transaction `FB03`

## Troubleshooting

### Issue: "SAP IS authentication failed"
- Check OAuth credentials are correct
- Verify token URL is accessible
- Check client has required scopes

### Issue: "SAP posting failed"
- Check API endpoint URL is correct
- Verify network connectivity to SAP IS
- Check SAP API logs for validation errors
- Review `transformToSAPFormat()` matches your API schema

### Issue: Entry approved but no document number
- Check application logs: `cf logs bookshop-srv --recent`
- Look for `[SBPA Webhook] Failed to post MJE to SAP`
- SAP posting errors don't fail the approval
- User can manually retry with "Post to SAP" button

## Next Steps

1. **Get SAP IS API details** from your SAP Integration Suite admin
2. **Configure credentials** using commands above
3. **Test end-to-end**:
   - Create MJE → SBPA approval → Auto-post to SAP
4. **Verify in SAP** using FB03 transaction
