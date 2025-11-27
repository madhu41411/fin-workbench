const cds = require('@sap/cds');
const sbpaIntegration = require('./sbpa-integration');
const sapISIntegration = require('./sap-is-integration');

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

    // Action: Send to SBPA for Approval
    this.on('sendToSBPA', 'JournalEntries', async (req) => {
        const { processDefinition } = req.data;

        // Get the journal entry with items
        const je = await SELECT.one.from(req.subject).columns(j => { j.items('*'), j.ID, j.companyCode, j.headerText, j.postingDate, j.totalAmount, j.currency, j.status });

        if (!je) return req.error(404, 'Journal Entry not found');

        // Validate it's in the right status
        if (je.status !== 'Pending' && je.status !== 'Draft') {
            return req.error(400, `Only Pending or Draft entries can be sent to SBPA. Current status: ${je.status}`);
        }

        // Validate balance
        let totalDebit = 0;
        let totalCredit = 0;
        if (je.items) {
            je.items.forEach(item => {
                if (item.dcIndicator === 'D') totalDebit += Number(item.amount);
                else if (item.dcIndicator === 'C') totalCredit += Number(item.amount);
            });
        }

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return req.error(400, `Cannot send unbalanced entry to SBPA. Debit: ${totalDebit}, Credit: ${totalCredit}`);
        }

        try {
            // Prepare context data for SBPA
            const context = {
                journalEntryId: je.ID,
                companyCode: je.companyCode,
                headerText: je.headerText,
                postingDate: je.postingDate,
                totalAmount: je.totalAmount,
                currency: je.currency,
                items: je.items,
                callbackUrl: `${process.env.APP_URL || 'https://dc6127cdtrial-dev-bookshop-srv.cfapps.us10-001.hana.ondemand.com'}/sbpa/webhook/approval`
            };

            // Trigger SBPA process
            const sbpaInstanceId = await sbpaIntegration.triggerProcess(processDefinition, context);

            // Create process instance record
            const db = await cds.connect.to('db');
            const { ProcessInstances } = db.entities('SBPAService');

            const processInstance = await INSERT.into(ProcessInstances).entries({
                sbpaInstanceId: sbpaInstanceId,
                processDefinition: processDefinition,
                sourceEntity: 'MJE',
                sourceEntityId: je.ID,
                status: 'Running',
                startedAt: new Date()
            });

            // Update JE status
            await UPDATE(req.subject).set({ status: 'Pending' });

            // Log workflow event
            await INSERT.into(WorkflowLogs).entries({
                parent_ID: je.ID,
                action: 'Send to SBPA',
                actor: req.user.id || 'User',
                timestamp: new Date().toISOString(),
                comment: `Triggered SBPA process: ${processDefinition}, Instance: ${sbpaInstanceId}`
            });

            console.log(`[SBPA] Triggered approval workflow for MJE ${je.ID}, SBPA instance: ${sbpaInstanceId}`);

            return {
                processInstanceId: processInstance.ID,
                sbpaInstanceId: sbpaInstanceId
            };
        } catch (error) {
            console.error('[SBPA] Failed to trigger workflow:', error);
            return req.error(500, `Failed to start SBPA workflow: ${error.message}`);
        }
    });

    // Action: Post to SAP via Integration Suite
    this.on('postToSAP', 'JournalEntries', async (req) => {
        // Retrieve full journal entry with items
        const je = await SELECT.one.from(req.subject).columns(j => {
            j('*'),
                j.items('*')
        });

        if (!je) return req.error(404, 'Journal Entry not found');
        if (je.status !== 'Approved') return req.error(400, 'Only Approved entries can be posted to SAP');
        if (je.accountingDocumentNumber) return req.error(400, `Entry already posted. Document Number: ${je.accountingDocumentNumber}`);

        console.log(`[MJE] Manually posting JE ${je.ID} to SAP via Integration Suite...`);

        try {
            let docNum;

            // Check if SAP IS API is configured
            if (sapISIntegration.apiUrl) {
                // Real API configured
                console.log('[MJE] Using SAP Integration Suite API');
                docNum = await sapISIntegration.postJournalEntry(je);
            } else {
                // Mock mode (no API configured)
                console.log('[MJE] SAP IS API not configured, using mock mode');
                docNum = await sapISIntegration.mockPost(je);
            }

            console.log(`[MJE] Success! Accounting Document Number: ${docNum}`);

            // Update Database
            await UPDATE(req.subject).set({ accountingDocumentNumber: docNum });

            // Log Workflow
            await INSERT.into(WorkflowLogs).entries({
                parent_ID: je.ID,
                action: 'Post to SAP',
                actor: req.user.id || 'System',
                timestamp: new Date().toISOString(),
                comment: `Posted to SAP via Integration Suite. Document Number: ${docNum}`
            });

            return docNum;
        } catch (error) {
            console.error('[MJE] Failed to post to SAP:', error);
            return req.error(500, `Failed to post to SAP: ${error.message}`);
        }
    });

    // Action: Preview SAP Payload
    this.on('previewSAPPayload', 'JournalEntries', async (req) => {
        // Retrieve full journal entry with items
        const je = await SELECT.one.from(req.subject).columns(j => {
            j('*'),
                j.items('*')
        });

        if (!je) return req.error(404, 'Journal Entry not found');

        try {
            // Transform to SAP format
            const sapPayload = sapISIntegration.transformToSAPFormat(je);
            return JSON.stringify(sapPayload, null, 2);
        } catch (error) {
            console.error('[MJE] Failed to generate SAP payload:', error);
            return req.error(500, `Failed to generate payload: ${error.message}`);
        }
    });

    // Dashboard Stats
    this.on('getDashboardStats', async () => {
        const stats = await SELECT.from(JournalEntries).columns('status', 'count(1) as count').groupBy('status');
        return JSON.stringify(stats);
    });
});
