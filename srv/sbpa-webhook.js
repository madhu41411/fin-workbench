const cds = require('@sap/cds');
const sapISIntegration = require('./sap-is-integration');

module.exports = (app) => {
    // Webhook endpoint for SBPA approval callbacks
    app.post('/sbpa/webhook/approval', async (req, res) => {
        try {
            console.log('[SBPA Webhook] Received approval callback:', JSON.stringify(req.body));

            const { instanceId, status, decision, context } = req.body;

            const db = await cds.connect.to('db');
            const { ProcessInstances, ProcessEvents } = db.entities('SBPAService');

            // Find process instance by SBPA ID
            const processInstance = await SELECT.one.from(ProcessInstances)
                .where({ sbpaInstanceId: instanceId });

            if (!processInstance) {
                console.error(`[SBPA Webhook] Process instance not found: ${instanceId}`);
                return res.status(404).json({ error: 'Process instance not found' });
            }

            // Determine result from decision or status
            const result = decision || (status === 'COMPLETED' ? 'Approved' : status);

            // Update process instance
            await UPDATE(ProcessInstances, processInstance.ID).with({
                status: 'Completed',
                result: result,
                completedAt: new Date()
            });

            // Log event
            await INSERT.into(ProcessEvents).entries({
                processInstance_ID: processInstance.ID,
                eventType: 'Approval',
                eventData: JSON.stringify(req.body),
                receivedAt: new Date()
            });

            // Update source entity (MJE)
            await updateSourceEntity(processInstance, result, context);

            console.log(`[SBPA Webhook] Successfully processed approval for instance ${instanceId}`);
            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            console.error('[SBPA Webhook] Error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Webhook endpoint for process completion
    app.post('/sbpa/webhook/complete', async (req, res) => {
        try {
            console.log('[SBPA Webhook] Received completion callback:', JSON.stringify(req.body));

            const { instanceId, status, context } = req.body;

            const db = await cds.connect.to('db');
            const { ProcessInstances, ProcessEvents } = db.entities('SBPAService');

            const processInstance = await SELECT.one.from(ProcessInstances)
                .where({ sbpaInstanceId: instanceId });

            if (!processInstance) {
                return res.status(404).json({ error: 'Process instance not found' });
            }

            await UPDATE(ProcessInstances, processInstance.ID).with({
                status: 'Completed',
                completedAt: new Date()
            });

            await INSERT.into(ProcessEvents).entries({
                processInstance_ID: processInstance.ID,
                eventType: 'Completed',
                eventData: JSON.stringify(req.body),
                receivedAt: new Date()
            });

            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            console.error('[SBPA Webhook] Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Webhook endpoint for process errors
    app.post('/sbpa/webhook/error', async (req, res) => {
        try {
            console.log('[SBPA Webhook] Received error callback:', JSON.stringify(req.body));

            const { instanceId, error, errorMessage } = req.body;

            const db = await cds.connect.to('db');
            const { ProcessInstances, ProcessEvents } = db.entities('SBPAService');

            const processInstance = await SELECT.one.from(ProcessInstances)
                .where({ sbpaInstanceId: instanceId });

            if (!processInstance) {
                return res.status(404).json({ error: 'Process instance not found' });
            }

            await UPDATE(ProcessInstances, processInstance.ID).with({
                status: 'Error',
                errorMessage: errorMessage || error || 'Unknown error',
                completedAt: new Date()
            });

            await INSERT.into(ProcessEvents).entries({
                processInstance_ID: processInstance.ID,
                eventType: 'Error',
                eventData: JSON.stringify(req.body),
                receivedAt: new Date()
            });

            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            console.error('[SBPA Webhook] Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

async function updateSourceEntity(processInstance, result, context) {
    const db = await cds.connect.to('db');

    try {
        if (processInstance.sourceEntity === 'MJE') {
            const { JournalEntries } = db.entities('MJEService');

            const newStatus = result === 'Approved' || result === 'APPROVED' ? 'Approved' : 'Rejected';

            await UPDATE(JournalEntries, processInstance.sourceEntityId).with({
                status: newStatus
            });

            console.log(`[SBPA Webhook] Updated MJE ${processInstance.sourceEntityId} status to ${newStatus}`);

            // AUTO-POST TO SAP: If approved, automatically post to SAP via Integration Suite
            if (newStatus === 'Approved') {
                try {
                    console.log(`[SBPA Webhook] Auto-posting MJE ${processInstance.sourceEntityId} to SAP...`);

                    // Fetch full journal entry with items
                    const je = await SELECT.one.from(JournalEntries, processInstance.sourceEntityId)
                        .columns(j => {
                            j('*'),
                                j.items('*')
                        });

                    if (!je) {
                        console.error(`[SBPA Webhook] Could not fetch MJE ${processInstance.sourceEntityId} for SAP posting`);
                        return;
                    }

                    // Check if already posted
                    if (je.accountingDocumentNumber) {
                        console.log(`[SBPA Webhook] MJE already posted to SAP. Document: ${je.accountingDocumentNumber}`);
                        return;
                    }

                    // Post to SAP via Integration Suite
                    let docNumber;
                    if (sapISIntegration.apiUrl) {
                        // Real API configured
                        docNumber = await sapISIntegration.postJournalEntry(je);
                    } else {
                        // Mock mode (no API configured)
                        console.log('[SBPA Webhook] SAP IS API not configured, using mock mode');
                        docNumber = await sapISIntegration.mockPost(je);
                    }

                    // Update MJE with accounting document number
                    await UPDATE(JournalEntries, processInstance.sourceEntityId).with({
                        accountingDocumentNumber: docNumber
                    });

                    console.log(`[SBPA Webhook] Successfully posted MJE to SAP. Document Number: ${docNumber}`);
                } catch (sapError) {
                    console.error(`[SBPA Webhook] Failed to post MJE to SAP:`, sapError);
                    // Don't fail the webhook - just log the error
                    // The entry remains Approved but without doc number
                    // User can manually retry via "Post to SAP" button
                }
            }

            // If approved and context includes accounting doc number from SBPA, update it
            if (newStatus === 'Approved' && context && context.accountingDocumentNumber) {
                await UPDATE(JournalEntries, processInstance.sourceEntityId).with({
                    accountingDocumentNumber: context.accountingDocumentNumber
                });
            }
        } else if (processInstance.sourceEntity === 'PPC') {
            const { PostingPeriodRequests } = db.entities('PostingPeriodService');

            const newStatus = result === 'Approved' || result === 'APPROVED' ? 'APPROVED' : 'REJECTED';

            await UPDATE(PostingPeriodRequests, processInstance.sourceEntityId).with({
                status: newStatus
            });

            console.log(`[SBPA Webhook] Updated PPC ${processInstance.sourceEntityId} status to ${newStatus}`);
        }
    } catch (error) {
        console.error('[SBPA Webhook] Error updating source entity:', error);
        throw error;
    }
}
