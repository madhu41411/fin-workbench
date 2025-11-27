// Global State
let allInvoices = [];
let selectedInvoiceIds = new Set();

// Constants
const API_BASE = '/odata/v4/invoice/';

// DOM Elements
const tableBody = document.querySelector('#invoice-table tbody');
const selectAllCheckbox = document.getElementById('select-all');
const btnVerifyManual = document.getElementById('btn-verify-manual');
const modal = document.getElementById('verification-modal');
const btnCancelVerify = document.getElementById('btn-cancel-verify');
const btnConfirmVerify = document.getElementById('btn-confirm-verify');
const txtVerificationComment = document.getElementById('verification-comment');
const filterStatus = document.getElementById('filter-status');
const filterVendor = document.getElementById('filter-vendor');
const btnApplyFilters = document.getElementById('btn-apply-filters');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchInvoices();
    setupEventListeners();
    updateDashboard(); // Initial empty state or fetch
});

function setupEventListeners() {
    // Filters
    btnApplyFilters.addEventListener('click', applyFilters);

    // Selection
    selectAllCheckbox.addEventListener('change', handleSelectAll);

    // Manual Verification
    btnVerifyManual.addEventListener('click', () => {
        if (selectedInvoiceIds.size > 0) {
            modal.classList.remove('hidden');
        }
    });

    btnCancelVerify.addEventListener('click', () => {
        modal.classList.add('hidden');
        txtVerificationComment.value = '';
    });

    btnConfirmVerify.addEventListener('click', submitManualVerification);
}

async function fetchInvoices() {
    try {
        const response = await fetch(`${API_BASE}Invoices`);
        const data = await response.json();
        allInvoices = data.value;
        populateVendorFilter();
        renderTable(allInvoices);
        updateDashboard();
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
}

function populateVendorFilter() {
    const vendors = [...new Set(allInvoices.map(i => i.vendorName))];
    filterVendor.innerHTML = '<option value="all">All Vendors</option>';
    vendors.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor;
        option.textContent = vendor;
        filterVendor.appendChild(option);
    });
}

function renderTable(invoices) {
    tableBody.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');

        // Checkbox
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.id = invoice.ID;
        checkbox.checked = selectedInvoiceIds.has(invoice.ID);
        checkbox.addEventListener('change', (e) => handleRowSelect(e, invoice.ID));

        // Disable checkbox if already matched or verified
        if (invoice.status === 'Matched' || invoice.status === 'ManuallyVerified') {
            checkbox.disabled = true;
        }

        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        // Data Columns
        row.innerHTML += `
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.vendorName}</td>
            <td>${invoice.amount} ${invoice.currency}</td>
            <td><span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></td>
            <td>${invoice.matchConfidence}%</td>
            <td>${invoice.matchReason || '-'}</td>
            <td>
                <!-- Action buttons could go here -->
            </td>
        `;

        // Re-attach checkbox (since innerHTML overwrote it)
        row.cells[0].innerHTML = '';
        row.cells[0].appendChild(checkbox);

        tableBody.appendChild(row);
    });
}

function handleRowSelect(e, id) {
    if (e.target.checked) {
        selectedInvoiceIds.add(id);
    } else {
        selectedInvoiceIds.delete(id);
    }
    updateActionButtons();
}

function handleSelectAll(e) {
    const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        if (e.target.checked) {
            selectedInvoiceIds.add(cb.dataset.id);
        } else {
            selectedInvoiceIds.delete(cb.dataset.id);
        }
    });
    updateActionButtons();
}

function updateActionButtons() {
    btnVerifyManual.disabled = selectedInvoiceIds.size === 0;
    if (selectedInvoiceIds.size > 0) {
        btnVerifyManual.classList.remove('secondary');
        btnVerifyManual.classList.add('primary');
    } else {
        btnVerifyManual.classList.add('secondary');
        btnVerifyManual.classList.remove('primary');
    }
}

function applyFilters() {
    const status = filterStatus.value;
    const vendor = filterVendor.value;

    let filtered = allInvoices;

    if (status !== 'all') {
        filtered = filtered.filter(i => i.status === status);
    }
    if (vendor !== 'all') {
        filtered = filtered.filter(i => i.vendorName === vendor);
    }

    renderTable(filtered);
}

async function submitManualVerification() {
    const comment = txtVerificationComment.value;
    const ids = Array.from(selectedInvoiceIds);

    // Process sequentially for the mock (in real app, could be batch)
    for (const id of ids) {
        try {
            await fetch(`${API_BASE}verifyInvoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceID: id, comment: comment })
            });
        } catch (error) {
            console.error('Error verifying:', error);
        }
    }

    // Reset UI
    modal.classList.add('hidden');
    txtVerificationComment.value = '';
    selectedInvoiceIds.clear();
    selectAllCheckbox.checked = false;
    updateActionButtons();

    // Refresh Data
    await fetchInvoices();
}

async function updateDashboard() {
    // Calculate metrics locally from allInvoices for immediate feedback
    // Or fetch from backend endpoint
    try {
        const response = await fetch(`${API_BASE}getTelemetry()`);
        const data = await response.json();
        // OData function returns object wrapped in value usually, but depends on CAP version/config
        // For string return type in CDS, it might be just value. 
        // Let's parse the string if it comes as a string.

        let metrics = data.value;
        if (typeof metrics === 'string') {
            metrics = JSON.parse(metrics);
        }

        document.getElementById('metric-total').textContent = metrics.total;
        document.getElementById('metric-matched').textContent = metrics.matched;
        document.getElementById('metric-mismatch').textContent = metrics.mismatch;
        document.getElementById('metric-verified').textContent = metrics.verified;
        document.getElementById('metric-rate').textContent = metrics.successRate + '%';

    } catch (error) {
        console.error('Error fetching telemetry:', error);
    }
}
