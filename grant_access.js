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
    console.log("Connected to HANA as HDI User");

    // Attempt to grant access to DBADMIN
    // Note: This might fail if the HDI user doesn't have grant rights, but it's worth a try.
    const query = `GRANT SELECT ON SCHEMA "${credentials.schema}" TO DBADMIN`;
    console.log(`Executing: ${query}`);

    conn.exec(query, (err, result) => {
        if (err) {
            console.error("Grant error:", err.message);
            console.log("\n--- INFO ---");
            console.log("Could not grant access to DBADMIN. This is common with HDI isolation.");
            console.log("You must log in using the HDI credentials directly.");
        } else {
            console.log("Successfully granted SELECT access to DBADMIN!");
        }
        conn.disconnect();
    });
});
