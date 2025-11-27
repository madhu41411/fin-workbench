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

const tablesToDrop = [
    `"${credentials.schema}"."SAP_MJE_JOURNALENTRIES"`,
    `"${credentials.schema}"."SAP_MJE_JOURNALENTRYITEMS"`,
    `"${credentials.schema}"."SAP_MJE_WORKFLOWLOGS"`
];

conn.connect(connParams, (err) => {
    if (err) {
        console.error("Connection error:", err);
        return;
    }
    console.log("Connected to HANA");

    const dropTables = async () => {
        for (const table of tablesToDrop) {
            const sql = `DROP TABLE ${table}`;
            try {
                await new Promise((resolve, reject) => {
                    conn.exec(sql, (err, result) => {
                        if (err) {
                            // Ignore "table not found" errors
                            if (err.code === 259) {
                                console.log(`Table ${table} does not exist (skipping)`);
                                resolve();
                            } else {
                                reject(err);
                            }
                        } else {
                            console.log(`Dropped table: ${table}`);
                            resolve(result);
                        }
                    });
                });
            } catch (error) {
                console.error(`Error dropping table ${table}:`, error.message);
            }
        }
        conn.disconnect();
        console.log("Database reset complete");
    };

    dropTables();
});
