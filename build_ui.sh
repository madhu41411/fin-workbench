#!/bin/bash
set -e

echo "Starting UI Build Process..."

# Build mje-ui
if [ -d "app/mje-ui" ]; then
    echo "Building mje-ui..."
    cd app/mje-ui
    npm ci
    npm run build
    cd ../..
else
    echo "Warning: app/mje-ui directory not found!"
fi

# Build ppc-ui
if [ -d "app/ppc-ui" ]; then
    echo "Building ppc-ui..."
    cd app/ppc-ui
    npm ci
    npm run build
    cd ../..
else
    echo "Warning: app/ppc-ui directory not found!"
fi

echo "UI Build Process Completed Successfully."
