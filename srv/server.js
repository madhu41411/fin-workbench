const cds = require('@sap/cds');
const express = require('express');
const path = require('path');
const sbpaWebhook = require('./sbpa-webhook');

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

        // Serve static files for invoice-matcher
        const imPath = path.join(__dirname, '..', 'app', 'invoice-matcher');
        app.use('/app/invoice-matcher', express.static(imPath));
        console.log(`[IM] Static files middleware registered for /app/invoice-matcher from ${imPath}`);

        // Register SBPA webhook routes
        sbpaWebhook(app);
        console.log('[SBPA] Webhook routes registered');
    }
});

module.exports = cds.server;
