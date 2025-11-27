const hana = require('@sap/hana-client');

// Database connection credentials from service key
const dbConfig = {
    host: 'ed5da539-d8e2-4074-bd8a-655b30ed5521.hana.trial-us10.hanacloud.ondemand.com',
    port: '443',
    user: '9FA3AD2F596746F2BA3B5C2029956093_0B23CEIUAQMIE4QMVK1O7NM9C_RT',
    password: 'v7@ ik]=|DaFNO(,#<sLC#gyNVM]H`f@ey?ZG`Cf@~CFRUC~y;-&9ThC&yO22Z0H1%QUc**}x{NTYP,l}]4tKe~QxV#@M)qd#!@s!6r.5=+/NOM!#d|iB2D]^z]14]#F',
    schema: '9FA3AD2F596746F2BA3B5C2029956093',
    encrypt: true,
    sslValidateCertificate: false
};

const journalEntryId = '58a2a8e8-6baf-4c33-81c3-afc31da4218d';

async function queryHANA() {
    const connection = hana.createConnection();

    try {
        console.log('Connecting to HANA database...');
        await new Promise((resolve, reject) => {
            connection.connect(dbConfig, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✓ Connected successfully\n');

        // Query 1: Journal Entry Header
        console.log('=== JOURNAL ENTRY HEADER ===');
        const jeQuery = `
      SELECT *
      FROM "9FA3AD2F596746F2BA3B5C2029956093"."SAP_MJE_JOURNALENTRIES"
      WHERE ID = ?
    `;

        const jeResult = await executeQuery(connection, jeQuery, [journalEntryId]);
        console.table(jeResult);

        // Query 2: Journal Entry Line Items
        console.log('\n=== JOURNAL ENTRY LINE ITEMS ===');
        const itemsQuery = `
      SELECT *
      FROM "9FA3AD2F596746F2BA3B5C2029956093"."SAP_MJE_JOURNALENTRYITEMS"
      WHERE PARENT_ID = ?
    `;

        const itemsResult = await executeQuery(connection, itemsQuery, [journalEntryId]);
        console.table(itemsResult);

        // Query 3: Workflow Logs
        console.log('\n=== WORKFLOW LOGS ===');
        const logsQuery = `
      SELECT *
      FROM "9FA3AD2F596746F2BA3B5C2029956093"."SAP_MJE_WORKFLOWLOGS"
      WHERE PARENT_ID = ?
    `;

        const logsResult = await executeQuery(connection, logsQuery, [journalEntryId]);
        console.table(logsResult);

        // Query 4: SBPA Process Instances
        console.log('\n=== SBPA PROCESS INSTANCES ===');
        const sbpaQuery = `
      SELECT *
      FROM "9FA3AD2F596746F2BA3B5C2029956093"."SAP_MJE_PROCESSINSTANCES"
      WHERE SOURCEENTITYID = ?
    `;

        const sbpaResult = await executeQuery(connection, sbpaQuery, [journalEntryId]);
        console.table(sbpaResult);

        console.log('\n✅ Successfully retrieved all data for Journal Entry:', journalEntryId);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    } finally {
        connection.disconnect();
        console.log('\n✓ Disconnected from HANA database');
    }
}

function executeQuery(connection, sql, params) {
    return new Promise((resolve, reject) => {
        connection.exec(sql, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

queryHANA();
