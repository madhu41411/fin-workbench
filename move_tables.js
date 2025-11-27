const hana = require('@sap/hana-client');
const fs = require('fs');
const path = require('path');

// Read credentials from .cdsrc.json
const cdsrcPath = path.join(__dirname, '.cdsrc.json');
let credentials;

try {
    const cdsrc = JSON.parse(fs.readFileSync(cdsrcPath, 'utf8'));
    credentials = cdsrc.requires.db.credentials;
} catch (e) {
    console.error("Error reading .cdsrc.json:", e.message);
    process.exit(1);
}

// Parse host and port from JDBC URL
const jdbcUrl = credentials.url;
// Extract host and port from jdbc:sap://host:port...
const match = jdbcUrl.match(/jdbc:sap:\/\/([^:]+):(\d+)/);
let serverNode;

if (match) {
    serverNode = `${match[1]}:${match[2]}`;
} else {
    console.error("Could not parse host/port from JDBC URL:", jdbcUrl);
    process.exit(1);
}

const connParams = {
    serverNode: serverNode,
    uid: credentials.user,
    pwd: credentials.password,
    encrypt: 'true',
    validateCertificate: 'true',
    currentSchema: credentials.schema
};

const conn = hana.createConnection();

const sqlCommands = [
    `CREATE SCHEMA IF NOT EXISTS DBADMIN`,
    `CREATE TABLE DBADMIN.SAP_MJE_JOURNALENTRIES AS (SELECT * FROM "${credentials.schema}"."SAP_MJE_JOURNALENTRIES") WITH DATA`,
    `CREATE TABLE DBADMIN.SAP_MJE_JOURNALENTRYITEMS AS (SELECT * FROM "${credentials.schema}"."SAP_MJE_JOURNALENTRYITEMS") WITH DATA`,
    `CREATE TABLE DBADMIN.SAP_MJE_WORKFLOWLOGS AS (SELECT * FROM "${credentials.schema}"."SAP_MJE_WORKFLOWLOGS") WITH DATA`,
    `DROP TABLE "${credentials.schema}"."SAP_MJE_JOURNALENTRIES"`,
    `DROP TABLE "${credentials.schema}"."SAP_MJE_JOURNALENTRYITEMS"`,
    `DROP TABLE "${credentials.schema}"."SAP_MJE_WORKFLOWLOGS"`,
    `CREATE SYNONYM "${credentials.schema}"."SAP_MJE_JOURNALENTRIES" FOR DBADMIN."SAP_MJE_JOURNALENTRIES"`,
    `CREATE SYNONYM "${credentials.schema}"."SAP_MJE_JOURNALENTRYITEMS" FOR DBADMIN."SAP_MJE_JOURNALENTRYITEMS"`,
    `CREATE SYNONYM "${credentials.schema}"."SAP_MJE_WORKFLOWLOGS" FOR DBADMIN."SAP_MJE_WORKFLOWLOGS"`
];

conn.connect(connParams, (err) => {
    if (err) {
        console.error("Connection error:", err);
        return;
    }
    console.log("Connected to HANA");

    const executeCommands = async () => {
        for (const sql of sqlCommands) {
            try {
                await new Promise((resolve, reject) => {
                    conn.exec(sql, (err, result) => {
                        if (err) {
                            // Ignore "table already exists" or "table not found" errors to make it idempotent
                            if (err.code === 288 || err.code === 259) {
                                console.warn(`Warning executing: ${sql}\n${err.message}`);
                                resolve();
                            } else {
                                reject(err);
                            }
                        } else {
                            console.log(`Success: ${sql}`);
                            resolve(result);
                        }
                    });
                });
            } catch (error) {
                console.error(`Error executing: ${sql}`, error);
                // Don't break on error, try to continue (e.g. if drop fails because table moved)
            }
        }
        conn.disconnect();
        console.log("Done");
    };

    executeCommands();
});
