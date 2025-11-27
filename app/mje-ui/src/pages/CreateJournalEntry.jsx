import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Send, ArrowLeft, Upload, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import Papa from 'papaparse';

export default function CreateJournalEntry() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploadMode, setUploadMode] = useState('manual'); // 'manual' or 'csv'
    const [header, setHeader] = useState({
        companyCode: '',
        postingDate: new Date().toISOString().split('T')[0],
        documentDate: new Date().toISOString().split('T')[0],
        headerText: '',
        currency: 'USD'
    });

    const [items, setItems] = useState([
        { id: 1, glAccount: '', amount: '', dcIndicator: 'D', costCenter: '', itemText: '' },
        { id: 2, glAccount: '', amount: '', dcIndicator: 'C', costCenter: '', itemText: '' }
    ]);

    const addItem = () => {
        setItems([...items, {
            id: items.length + 1,
            glAccount: '',
            amount: '',
            dcIndicator: 'D',
            costCenter: '',
            itemText: ''
        }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const totalDebit = items
        .filter(i => i.dcIndicator === 'D')
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    const totalCredit = items
        .filter(i => i.dcIndicator === 'C')
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const handleSubmit = async (action) => {
        if (action === 'submit' && !isBalanced) {
            alert('Journal Entry must be balanced to submit.');
            return;
        }

        try {
            // Construct payload for CAP service
            const payload = {
                companyCode: header.companyCode,
                postingDate: header.postingDate,
                documentDate: header.documentDate,
                headerText: header.headerText,
                currency: header.currency,
                status: action === 'submit' ? 'Pending' : 'Draft',
                items: items.map(({ id, ...item }) => ({
                    ...item,
                    amount: Number(item.amount)
                }))
            };

            // Save to database
            const response = await axios.post('/odata/v4/mje/JournalEntries', payload);

            if (action === 'submit' && response.data.ID) {
                // Trigger approval workflow
                await axios.post(`/odata/v4/mje/JournalEntries(${response.data.ID})/MJEService.submitForApproval`, {});
            }

            alert(`Journal Entry ${action === 'save' ? 'Saved' : 'Submitted'} successfully!`);
            navigate('/journal-entries');
        } catch (error) {
            console.error('Error:', error);
            alert(`Failed to save entry: ${error.response?.data?.error?.message || error.message}`);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file');
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const parsedItems = results.data.map((row, index) => ({
                        id: index + 1,
                        glAccount: row['GL Account'] || row['glAccount'] || '',
                        amount: row['Amount'] || row['amount'] || '',
                        dcIndicator: (row['D/C'] || row['dcIndicator'] || 'D').toUpperCase(),
                        costCenter: row['Cost Center'] || row['costCenter'] || '',
                        profitCenter: row['Profit Center'] || row['profitCenter'] || '',
                        itemText: row['Text'] || row['itemText'] || row['Description'] || ''
                    }));

                    if (parsedItems.length > 0) {
                        setItems(parsedItems);
                        setUploadMode('manual'); // Switch to manual mode to show the table
                        alert(`Successfully loaded ${parsedItems.length} line items from CSV`);
                    } else {
                        alert('No valid items found in CSV file');
                    }
                } catch (error) {
                    console.error('Error parsing CSV:', error);
                    alert('Error parsing CSV file. Please check the format.');
                }
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                alert('Failed to parse CSV file');
            }
        });

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/journal-entries')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">New Journal Entry</h2>
                        <p className="text-slate-500">Create a new manual journal entry</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSubmit('save')}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSubmit('submit')}
                        disabled={!isBalanced}
                        className={cn(
                            "px-4 py-2 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm",
                            isBalanced
                                ? "bg-accent hover:bg-blue-600 shadow-blue-200"
                                : "bg-slate-300 cursor-not-allowed"
                        )}
                    >
                        <Send className="w-4 h-4" />
                        Submit for Approval
                    </button>
                </div>
            </div>

            {/* Header Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Header Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Company Code</label>
                        <input
                            type="text"
                            value={header.companyCode}
                            onChange={(e) => setHeader({ ...header, companyCode: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                            placeholder="e.g. 1000"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Posting Date</label>
                        <input
                            type="date"
                            value={header.postingDate}
                            onChange={(e) => setHeader({ ...header, postingDate: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Document Date</label>
                        <input
                            type="date"
                            value={header.documentDate}
                            onChange={(e) => setHeader({ ...header, documentDate: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Header Text</label>
                        <input
                            type="text"
                            value={header.headerText}
                            onChange={(e) => setHeader({ ...header, headerText: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                            placeholder="Enter description..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Currency</label>
                        <select
                            value={header.currency}
                            onChange={(e) => setHeader({ ...header, currency: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Line Items</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setUploadMode('manual')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
                                    uploadMode === 'manual'
                                        ? "bg-accent text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Manual Entry
                            </button>
                            <button
                                onClick={() => setUploadMode('csv')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
                                    uploadMode === 'csv'
                                        ? "bg-accent text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <Upload className="w-3.5 h-3.5" />
                                CSV Upload
                            </button>
                        </div>
                    </div>

                    {uploadMode === 'csv' && (
                        <div className="bg-white rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="cursor-pointer inline-flex flex-col items-center gap-3"
                            >
                                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Upload CSV File</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Click to browse or drag and drop
                                    </p>
                                </div>
                                <div className="text-xs text-slate-400 mt-2 max-w-md">
                                    <p className="font-medium mb-1">Expected CSV Format:</p>
                                    <code className="bg-slate-50 px-2 py-1 rounded text-[10px] block">
                                        GL Account, D/C, Amount, Cost Center, Text
                                    </code>
                                </div>
                            </label>
                        </div>
                    )}

                    {uploadMode === 'manual' && (
                        <button
                            onClick={addItem}
                            className="text-sm font-medium text-accent hover:text-blue-600 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </button>
                    )}
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-500 w-12">#</th>
                            <th className="px-4 py-3 font-medium text-slate-500">GL Account</th>
                            <th className="px-4 py-3 font-medium text-slate-500 w-32">D/C</th>
                            <th className="px-4 py-3 font-medium text-slate-500 text-right">Amount</th>
                            <th className="px-4 py-3 font-medium text-slate-500">Cost Center</th>
                            <th className="px-4 py-3 font-medium text-slate-500">Text</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.map((item, index) => (
                            <tr key={index} className="group hover:bg-slate-50/50">
                                <td className="px-4 py-2 text-slate-400 font-mono text-xs">{index + 1}</td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.glAccount}
                                        onChange={(e) => updateItem(index, 'glAccount', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-accent outline-none py-1"
                                        placeholder="GL Acct"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <select
                                        value={item.dcIndicator}
                                        onChange={(e) => updateItem(index, 'dcIndicator', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-accent outline-none py-1"
                                    >
                                        <option value="D">Debit</option>
                                        <option value="C">Credit</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-accent outline-none py-1 text-right font-mono"
                                        placeholder="0.00"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.costCenter}
                                        onChange={(e) => updateItem(index, 'costCenter', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-accent outline-none py-1"
                                        placeholder="CC"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.itemText}
                                        onChange={(e) => updateItem(index, 'itemText', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-accent outline-none py-1"
                                        placeholder="Description"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-medium text-slate-900 border-t border-slate-200">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                            <td className="px-4 py-3 text-right font-mono">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">Debit: {totalDebit.toFixed(2)}</span>
                                    <span className="text-xs text-slate-500">Credit: {totalCredit.toFixed(2)}</span>
                                </div>
                            </td>
                            <td colSpan={3} className="px-4 py-3">
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                                    isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {isBalanced ? (
                                        <>Balanced</>
                                    ) : (
                                        <>Unbalanced ({Math.abs(totalDebit - totalCredit).toFixed(2)})</>
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
