const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { JournalEntries, JournalEntryItems, WorkflowLogs } = this.entities;

    // Validation before saving
    this.before(['CREATE', 'UPDATE'], 'JournalEntries', async (req) => {
        const { items } = req.data;
        if (items) {
            let totalDebit = 0;
            let totalCredit = 0;

            items.forEach(item => {
                if (item.dcIndicator === 'D') totalDebit += item.amount;
                else if (item.dcIndicator === 'C') totalCredit += item.amount;
            });

            if (totalDebit !== totalCredit) {
                // req.error(400, `Journal Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
                // For draft saving, maybe we allow unbalanced? 
                // Let's enforce balance only on Submit. 
                // But user asked to "control" the process. Let's warn or just calculate total.
            }

            req.data.totalAmount = totalDebit; // Assuming balanced
        }
    });

    // Action: Submit for Approval
    this.on('submitForApproval', 'JournalEntries', async (req) => {
        // Use req.subject to ensure correct entity addressing
        const je = await SELECT.one.from(req.subject).columns(j => { j.items('*') });

        if (!je) return req.error(404, 'Journal Entry not found');

        // Validate Balance
        let totalDebit = 0;
        let totalCredit = 0;
        if (je.items) {
            je.items.forEach(item => {
                if (item.dcIndicator === 'D') totalDebit += Number(item.amount);
                else if (item.dcIndicator === 'C') totalCredit += Number(item.amount);
            });
        }

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return req.error(400, `Cannot submit unbalanced entry. Debit: ${totalDebit}, Credit: ${totalCredit}`);
        }

        await UPDATE(req.subject).set({ status: 'Pending' });

        // Log Workflow
        await INSERT.into(WorkflowLogs).entries({
            parent_ID: je.ID,
            action: 'Submit',
            actor: req.user.id || 'User',
            timestamp: new Date().toISOString(),
            comment: 'Submitted for approval'
        });

        // Trigger SBPA API (Mock)
        console.log(`[SBPA-TRIGGER] Triggering approval workflow for JE ${je.ID}`);

        return { status: 'Pending' };
    });

    // Action: Approve
    this.on('approve', 'JournalEntries', async (req) => {
        const { comment } = req.data;

        // Retrieve ID from subject for logging
        const [je] = await SELECT.from(req.subject).columns('ID');
        if (!je) return req.error(404, 'Journal Entry not found');

        await UPDATE(req.subject).set({ status: 'Approved' });

        await INSERT.into(WorkflowLogs).entries({
            parent_ID: je.ID,
            action: 'Approve',
            actor: req.user.id || 'Approver',
            timestamp: new Date().toISOString(),
            comment: comment || 'Approved'
        });

        return { status: 'Approved' };
    });

    // Action: Reject
    this.on('reject', 'JournalEntries', async (req) => {
        const { comment } = req.data;

        // Retrieve ID from subject for logging
        const [je] = await SELECT.from(req.subject).columns('ID');
        if (!je) return req.error(404, 'Journal Entry not found');

        await UPDATE(req.subject).set({ status: 'Rejected' });

        await INSERT.into(WorkflowLogs).entries({
            parent_ID: je.ID,
            action: 'Reject',
            actor: req.user.id || 'Approver',
            timestamp: new Date().toISOString(),
            comment: comment || 'Rejected'
        });

        return { status: 'Rejected' };
    });

    // Action: Post to SAP (Mock)
    this.on('postToSAP', 'JournalEntries', async (req) => {
        // Retrieve ID from subject
        const [je] = await SELECT.from(req.subject).columns('ID', 'status', 'accountingDocumentNumber');

        if (!je) return req.error(404, 'Journal Entry not found');
        if (je.status !== 'Approved') return req.error(400, 'Only Approved entries can be posted to SAP');
        if (je.accountingDocumentNumber) return req.error(400, `Entry already posted. Document Number: ${je.accountingDocumentNumber}`);

        console.log(`[SAP-MOCK] Posting JE ${je.ID} to SAP ECC via BTP Integration Suite...`);

        // Simulate API Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate Mock Accounting Document Number (10 digits)
        const mockDocNum = '1' + Math.floor(Math.random() * 900000000 + 100000000).toString();

        console.log(`[SAP-MOCK] Success! Generated Accounting Document Number: ${mockDocNum}`);

        // Update Database
        await UPDATE(req.subject).set({ accountingDocumentNumber: mockDocNum });

        // Log Workflow
        await INSERT.into(WorkflowLogs).entries({
            parent_ID: je.ID,
            action: 'Post to SAP',
            actor: req.user.id || 'System',
            timestamp: new Date().toISOString(),
            comment: `Posted to SAP. Document Number: ${mockDocNum}`
        });

        return mockDocNum;
    });

    // Dashboard Stats
    this.on('getDashboardStats', async () => {
        const stats = await SELECT.from(JournalEntries).columns('status', 'count(1) as count').groupBy('status');
        return JSON.stringify(stats);
    });
});
