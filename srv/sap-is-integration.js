const axios = require('axios');

class SAPIntegrationSuite {
    constructor() {
        this.apiUrl = process.env.SAP_IS_API_URL;
        this.authType = process.env.SAP_IS_AUTH_TYPE || 'oauth'; // 'oauth', 'basic', 'apikey'
        this.clientId = process.env.SAP_IS_CLIENT_ID;
        this.clientSecret = process.env.SAP_IS_CLIENT_SECRET;
        this.tokenUrl = process.env.SAP_IS_TOKEN_URL;
        this.apiKey = process.env.SAP_IS_API_KEY;
        this.username = process.env.SAP_IS_USERNAME;
        this.password = process.env.SAP_IS_PASSWORD;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.authType === 'basic' || this.authType === 'apikey') {
            return null; // No token needed
        }

        // Reuse token if still valid
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret || !this.tokenUrl) {
            throw new Error('SAP IS OAuth credentials not configured');
        }

        try {
            const response = await axios.post(this.tokenUrl,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                }),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

            console.log('[SAP IS] Successfully obtained access token');
            return this.accessToken;
        } catch (error) {
            console.error('[SAP IS] Failed to get access token:', error.response?.data || error.message);
            throw new Error('SAP IS authentication failed');
        }
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };

        if (this.authType === 'basic' && this.username && this.password) {
            const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        } else if (this.authType === 'apikey' && this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        return headers;
    }

    /**
     * Post Journal Entry to SAP via Integration Suite
     * @param {Object} journalEntry - The journal entry object
     * @returns {Promise<string>} - Accounting document number
     */
    async postJournalEntry(journalEntry) {
        if (!this.apiUrl) {
            throw new Error('SAP Integration Suite API URL not configured');
        }

        try {
            const headers = this.getAuthHeaders();

            // Add OAuth token if needed
            if (this.authType === 'oauth') {
                const token = await this.getAccessToken();
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Transform JE to SAP format
            const sapPayload = this.transformToSAPFormat(journalEntry);

            console.log('[SAP IS] Posting journal entry to SAP:', journalEntry.ID);

            const response = await axios.post(
                `${this.apiUrl}/JournalEntry`,
                sapPayload,
                { headers }
            );

            // Extract document number from response
            const docNumber = response.data.AccountingDocument ||
                response.data.documentNumber ||
                response.data.d?.AccountingDocument;

            console.log(`[SAP IS] Successfully posted to SAP. Document Number: ${docNumber}`);
            return docNumber;
        } catch (error) {
            console.error('[SAP IS] Failed to post to SAP:', error.response?.data || error.message);
            throw new Error(`SAP posting failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Transform Finance Workbench JE to SAP API format
     * This is a template - adjust based on your actual SAP API schema
     */
    transformToSAPFormat(journalEntry) {
        return {
            CompanyCode: journalEntry.companyCode,
            DocumentDate: journalEntry.documentDate,
            PostingDate: journalEntry.postingDate,
            DocumentHeaderText: journalEntry.headerText,
            DocumentType: 'SA', // Manual Journal Entry
            DocumentReferenceID: journalEntry.ID,

            // Line items
            to_JournalEntryItem: journalEntry.items.map((item, index) => ({
                ReferenceDocumentItem: (index + 1).toString(),
                GLAccount: item.glAccount,
                AmountInTransactionCurrency: item.amount,
                DebitCreditCode: item.dcIndicator === 'D' ? 'S' : 'H', // S=Debit, H=Credit in SAP
                CostCenter: item.costCenter,
                ProfitCenter: item.profitCenter,
                ItemText: item.itemText,
                TransactionCurrency: journalEntry.currency
            }))
        };
    }

    /**
     * Mock posting for testing (when API is not configured)
     */
    async mockPost(journalEntry) {
        console.log('[SAP IS MOCK] Simulating SAP posting...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockDocNum = '5' + Math.floor(Math.random() * 900000000 + 100000000).toString();
        console.log(`[SAP IS MOCK] Generated mock document number: ${mockDocNum}`);

        return mockDocNum;
    }
}

module.exports = new SAPIntegrationSuite();
