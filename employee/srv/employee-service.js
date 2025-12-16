const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Employee, Qualifications, Status, EmployeeView } = this.entities;

    // Helper to parse CSV
    const parseCSV = (content) => {
        const lines = content.split(/\r?\n/);
        const headers = lines[0].split(',');
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            const entry = {};
            headers.forEach((h, index) => {
                entry[h.trim()] = values[index] ? values[index].trim() : null;
            });
            data.push(entry);
        }
        return data;
    };

    this.on('downloadEmployeeData', async (req) => {
        const employees = await SELECT.from(EmployeeView);
        if (!employees || employees.length === 0) return '';

        const headers = Object.keys(employees[0]).join(',');
        const rows = employees.map(emp => Object.values(emp).join(','));
        return headers + '\n' + rows.join('\n');
    });

    this.on('uploadEmployeeData', async (req) => {
        const { content } = req.data;
        if (!content) return req.error(400, 'No content provided');

        const entries = parseCSV(content);
        const tx = cds.transaction(req);

        for (const entry of entries) {
            // Validation A: Status 1, 2, or 3
            if (!['1', '2', '3'].includes(entry.EMP_STATUS_ID)) {
                return req.error(400, `Invalid Status ID for Employee ${entry.EMPLOYEE_ID}. Must be 1, 2, or 3.`);
            }

            // Validation B: Degree mandatory
            if (!entry.DEGREE) {
                return req.error(400, `Degree is mandatory for Employee ${entry.EMPLOYEE_ID}.`);
            }

            const empId = parseInt(entry.EMPLOYEE_ID);
            const existing = await tx.run(SELECT.one.from(Employee).where({ EMPLOYEE_ID: empId }));

            if (existing) {
                // Update
                await tx.run(UPDATE(Employee).set({
                    FIRST_NAME: entry.FIRST_NAME,
                    LAST_NAME: entry.LAST_NAME,
                    EMAIL: entry.EMAIL,
                    DATE_OF_BIRTH: entry.DATE_OF_BIRTH,
                    EMP_STATUS_ID: parseInt(entry.EMP_STATUS_ID),
                    STATUS_CHANGED_DATE: entry.STATUS_CHANGED_DATE
                }).where({ EMPLOYEE_ID: empId }));

                // Update Qualification (Assuming 1:1 for simplicity based on flat file)
                // First delete existing to handle potential changes cleanly or update if ID known. 
                // Since file doesn't have Qual ID, we might need to delete and re-insert or find by Emp ID.
                // Strategy: Delete all quals for this emp and insert new.
                await tx.run(DELETE.from(Qualifications).where({ EMPLOYEE_ID: empId }));
                await tx.run(INSERT.into(Qualifications).entries({
                    QUALIFICATION_ID: cds.utils.uuid(),
                    EMPLOYEE_ID: empId,
                    DEGREE: entry.DEGREE,
                    UNIVERSITY: entry.UNIVERSITY,
                    GRADUATION_YEAR: parseInt(entry.GRADUATION_YEAR)
                }));

            } else {
                // Insert
                await tx.run(INSERT.into(Employee).entries({
                    EMPLOYEE_ID: empId,
                    FIRST_NAME: entry.FIRST_NAME,
                    LAST_NAME: entry.LAST_NAME,
                    EMAIL: entry.EMAIL,
                    DATE_OF_BIRTH: entry.DATE_OF_BIRTH,
                    EMP_STATUS_ID: parseInt(entry.EMP_STATUS_ID),
                    STATUS_CHANGED_DATE: entry.STATUS_CHANGED_DATE
                }));

                await tx.run(INSERT.into(Qualifications).entries({
                    QUALIFICATION_ID: cds.utils.uuid(),
                    EMPLOYEE_ID: empId,
                    DEGREE: entry.DEGREE,
                    UNIVERSITY: entry.UNIVERSITY,
                    GRADUATION_YEAR: parseInt(entry.GRADUATION_YEAR)
                }));
            }
        }
        return 'Upload Successful';
    });

    this.on('cleanupInactiveEmployees', async (req) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const dateStr = oneWeekAgo.toISOString().split('T')[0]; // YYYY-MM-DD

        // Find employees to delete
        // Status 3 = Inactive
        const toDelete = await SELECT.from(Employee)
            .where({ EMP_STATUS_ID: 3 })
            .and({ STATUS_CHANGED_DATE: { '<': dateStr } });

        console.log(`Found ${toDelete.length} inactive employees to delete.`);

        for (const emp of toDelete) {
            // Cascade delete handled by DB usually, but manual here for safety/explicit requirement
            await DELETE.from(Qualifications).where({ EMPLOYEE_ID: emp.EMPLOYEE_ID });
            await DELETE.from(Employee).where({ EMPLOYEE_ID: emp.EMPLOYEE_ID });
        }
    });
});
