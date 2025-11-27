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

conn.connect(connParams, (err) => {
    if (err) {
        console.error("Connection error:", err);
        return;
    }
    console.log("Connected to HANA");

    const query = `SELECT * FROM "${credentials.schema}"."SAP_MJE_JOURNALENTRIES" ORDER BY "CREATEDAT" DESC LIMIT 5`;

    conn.exec(query, (err, result) => {
        if (err) {
            console.error("Query error:", err);
        } else {
            console.log("\n--- Recent Journal Entries (Top 5) ---");
            if (result.length === 0) {
                console.log("No entries found.");
            } else {
                // Print first row keys to see column names
                if (result.length > 0) {
                    console.log("Available columns:", Object.keys(result[0]).join(", "));
                }

                console.table(result.map(row => ({
                    ID: row.ID.substring(0, 8) + '...',
                    Company: row.COMPANYCODE,
                    Date: row.POSTINGDATE,
                    Amount: row.TOTALAMOUNT,
                    Status: row.STATUS,
                    Text: row.HEADERTEXT
                })));
            }
        }
        conn.disconnect();
    });
});
