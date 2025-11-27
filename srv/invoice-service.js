const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Invoices, SAPDocuments } = this.entities;

    // Mock Data Store (In-memory for prototype)
    let mockInvoices = [];
    let mockSAPDocs = [];

    const _generateMockData = () => {
        if (mockInvoices.length > 0) return;

        const vendors = ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp'];
        const statuses = ['Pending', 'Matched', 'Mismatch', 'Mismatch', 'Matched']; // Weighted

        for (let i = 0; i < 50; i++) {
            const vendor = vendors[Math.floor(Math.random() * vendors.length)];
            const amount = (Math.random() * 10000).toFixed(2);
            const isMatched = Math.random() > 0.4;
            const status = isMatched ? 'Matched' : 'Mismatch';

            mockInvoices.push({
                ID: cds.utils.uuid(),
                invoiceNumber: `INV-${1000 + i}`,
                vendorName: vendor,
                amount: amount,
                currency: 'USD',
                invoiceDate: new Date().toISOString().split('T')[0],
                status: status,
                sapDocNumber: isMatched ? `SAP-${5000 + i}` : null,
                matchConfidence: isMatched ? 90 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 60),
                matchReason: isMatched ? 'Perfect Match' : 'Amount Mismatch'
            });
        }
    };

    _generateMockData();

    this.before('READ', Invoices, async (req) => {
        // Check if data exists, if not, generate it
        const count = await SELECT.one.from(Invoices).columns('count(*) as count');
        if (count.count === 0) {
            _generateMockData();
            await INSERT.into(Invoices).entries(mockInvoices);
        }
    });

    // Remove the custom READ handler to let CAP handle DB operations
    // this.on('READ', Invoices, ...) - REMOVED

    this.on('verifyInvoice', async (req) => {
        const { invoiceID, comment } = req.data;
        // Update in DB
        const result = await UPDATE(Invoices).set({
            status: 'ManuallyVerified',
            matchReason: `Manual: ${comment || 'Verified by user'}`,
            matchConfidence: 100
        }).where({ ID: invoiceID });

        return result === 1;
    });

    this.on('getTelemetry', async () => {
        const invoices = await SELECT.from(Invoices);
        const total = invoices.length;
        const matched = invoices.filter(i => i.status === 'Matched').length;
        const mismatch = invoices.filter(i => i.status === 'Mismatch').length;
        const verified = invoices.filter(i => i.status === 'ManuallyVerified').length;

        return JSON.stringify({
            total,
            matched,
            mismatch,
            verified,
            successRate: total ? ((matched + verified) / total * 100).toFixed(1) : 0
        });
    });
});
