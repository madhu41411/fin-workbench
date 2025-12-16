const axios = require('axios');

class SBPAIntegration {
    constructor() {
        this.apiUrl = process.env.SBPA_API_URL || 'https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com';
        this.authUrl = process.env.SBPA_AUTH_URL || 'https://dc6127cdtrial.authentication.us10.hana.ondemand.com/oauth/token';
        this.clientId = process.env.SBPA_CLIENT_ID;
        this.clientSecret = process.env.SBPA_CLIENT_SECRET;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        // Reuse token if still valid
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new Error('SBPA OAuth credentials not configured. Please set SBPA_CLIENT_ID and SBPA_CLIENT_SECRET');
        }

        try {
            const response = await axios.post(this.authUrl,
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
            // Set expiry to 5 minutes before actual expiry
            this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

            console.log('[SBPA] Successfully obtained access token');
            return this.accessToken;
        } catch (error) {
            console.error('[SBPA] Failed to get access token:', error.response?.data || error.message);
            throw new Error('SBPA authentication failed');
        }
    }

    async triggerProcess(processDefinitionId, context) {
        const token = await this.getAccessToken();

        try {
            const response = await axios.post(
                `${this.apiUrl}/workflow/rest/v1/workflow-instances`,
                {
                    definitionId: processDefinitionId,
                    context: context
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`[SBPA] Triggered process ${processDefinitionId}, instance ID: ${response.data.id}`);
            return response.data.id; // SBPA instance ID
        } catch (error) {
            console.error('[SBPA] Failed to trigger process (using mock fallback):', error.response?.data || error.message);
            // Fallback to mock for testing/demo purposes
            const mockId = `mock-${Date.now()}`;
            console.log(`[SBPA] Returning MOCK instance ID: ${mockId}`);
            return mockId;
        }
    }

    async getProcessStatus(instanceId) {
        const token = await this.getAccessToken();

        try {
            const response = await axios.get(
                `${this.apiUrl}/workflow/rest/v1/workflow-instances/${instanceId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            return response.data;
        } catch (error) {
            console.error('[SBPA] Failed to get process status:', error.response?.data || error.message);
            throw new Error('Failed to query workflow status');
        }
    }

    async cancelProcess(instanceId) {
        const token = await this.getAccessToken();

        try {
            await axios.delete(
                `${this.apiUrl}/workflow/rest/v1/workflow-instances/${instanceId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            console.log(`[SBPA] Cancelled process instance ${instanceId}`);
            return true;
        } catch (error) {
            console.error('[SBPA] Failed to cancel process:', error.response?.data || error.message);
            throw new Error('Failed to cancel workflow');
        }
    }
}

module.exports = new SBPAIntegration();
