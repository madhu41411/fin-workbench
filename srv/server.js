const cds = require('@sap/cds');
const express = require('express');
const path = require('path');

cds.on('served', () => {
    const app = cds.app;
    if (app) {
        // Serve static files for mje-ui
        // Files are at /home/vcap/app/app/mje-ui, and __dirname is /home/vcap/app/srv
        const mjeUiPath = path.join(__dirname, '..', 'app', 'mje-ui');
        app.use('/app/mje-ui', express.static(mjeUiPath));

        // Fallback to index.html for SPA routing
        app.get('/app/mje-ui/*', (req, res) => {
            res.sendFile(path.join(mjeUiPath, 'index.html'));
        });

        console.log(`[MJE] Static files middleware registered for /app/mje-ui from ${mjeUiPath}`);

        // Serve static files for ppc-ui
        const ppcUiPath = path.join(__dirname, '..', 'app', 'ppc-ui');
        app.use('/app/ppc-ui', express.static(ppcUiPath));

        // Fallback to index.html for SPA routing
        app.get('/app/ppc-ui/*', (req, res) => {
            res.sendFile(path.join(ppcUiPath, 'index.html'));
        });

        console.log(`[PPC] Static files middleware registered for /app/ppc-ui from ${ppcUiPath}`);
    }
});

module.exports = cds.server;
