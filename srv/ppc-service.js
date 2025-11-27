const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { PostingPeriodRequests, TimeLogs } = this.entities;

    this.on('openPeriod', async (req) => {
        const { period, year, companyCode, reason } = req.data;

        // 1. Create a new request record
        const newRequest = {
            period,
            year,
            companyCode,
            reason,
            status: 'PENDING',
            ticketId: `TICKET-${Math.floor(Math.random() * 10000)}` // Mock ticket creation
        };

        const result = await INSERT.into(PostingPeriodRequests).entries(newRequest);
        const requestId = result.results[0].ID;

        // 2. Mock HTTP call to SAP BTP Integration Suite
        // In a real scenario, we would use cds.connect.to('Destination').post(...)
        console.log(`[Mock Integration] Calling SAP BTP to open period ${period}/${year} for ${companyCode}...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        console.log(`[Mock Integration] SAP BTP responded: Success`);

        // 3. Update status to OPEN
        await UPDATE(PostingPeriodRequests).set({ status: 'OPEN' }).where({ ID: requestId });

        // 4. Start Time Tracking
        await INSERT.into(TimeLogs).entries({
            requestId: requestId,
            startTime: new Date().toISOString(),
            activity: 'Manual Posting Activity'
        });

        return `Period ${period}/${year} opened successfully. Ticket ${newRequest.ticketId} created.`;
    });

    this.on('closePeriod', async (req) => {
        const { requestId } = req.data;

        const request = await SELECT.one.from(PostingPeriodRequests).where({ ID: requestId });
        if (!request) return req.error(404, 'Request not found');

        if (request.status !== 'OPEN') return req.error(400, 'Period is not open');

        // 1. Mock HTTP call to SAP BTP Integration Suite
        console.log(`[Mock Integration] Calling SAP BTP to close period ${request.period}/${request.year}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[Mock Integration] SAP BTP responded: Success`);

        // 2. Update status to CLOSED
        await UPDATE(PostingPeriodRequests).set({ status: 'CLOSED' }).where({ ID: requestId });

        // 3. Stop Time Tracking
        const timeLog = await SELECT.one.from(TimeLogs).where({ requestId: requestId, endTime: null });
        if (timeLog) {
            const endTime = new Date();
            const startTime = new Date(timeLog.startTime);
            const duration = Math.round((endTime - startTime) / 60000); // minutes

            await UPDATE(TimeLogs).set({
                endTime: endTime.toISOString(),
                duration: duration
            }).where({ ID: timeLog.ID });
        }

        return `Period ${request.period}/${request.year} closed successfully.`;
    });
});
