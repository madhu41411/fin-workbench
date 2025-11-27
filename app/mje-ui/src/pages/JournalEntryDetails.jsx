import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText, Calendar, Building, DollarSign, CheckCircle, Clock, XCircle, User, Send } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        Draft: "bg-slate-100 text-slate-600",
        Pending: "bg-yellow-50 text-yellow-600",
        Approved: "bg-green-50 text-green-600",
        Rejected: "bg-red-50 text-red-600",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.Draft}`}>
            {status}
        </span>
    );
};

export default function JournalEntryDetails() {
    const { id } = useParams();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const response = await axios.get(`/odata/v4/mje/JournalEntries(${id})?$expand=items,workflowLogs`);
            setEntry(response.data);
        } catch (err) {
            console.error("Failed to fetch details:", err);
            setError("Failed to load journal entry details.");
        } finally {
            setLoading(false);
        }
    };

    const handlePostToSAP = async () => {
        if (!confirm("Are you sure you want to post this entry to SAP? This action cannot be undone.")) return;

        setPosting(true);
        try {
            const response = await axios.post(`/odata/v4/mje/JournalEntries(${id})/MJEService.postToSAP`, {});
            // Response value is the document number directly or wrapped in value
            const docNum = response.data.value || response.data;
            alert(`Successfully posted to SAP! Document Number: ${docNum}`);
            fetchDetails(); // Refresh to show new status/number
        } catch (err) {
            console.error("Failed to post to SAP:", err);
            alert("Failed to post to SAP. Please check logs.");
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!entry) return <div className="p-8 text-center text-slate-500">Entry not found.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
                <Link to="/journal-entries" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">JournalEntry Details</h1>
                    <p className="text-slate-500 text-sm">ID: {entry.ID}</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    {entry.status === 'Approved' && !entry.accountingDocumentNumber && (
                        <button
                            onClick={handlePostToSAP}
                            disabled={posting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {posting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {posting ? 'Posting...' : 'Post in SAP'}
                        </button>
                    )}
                    <StatusBadge status={entry.status} />
                </div>
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">Company Code</label>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <Building className="w-4 h-4 text-slate-400" />
                            {entry.companyCode}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">Posting Date</label>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {entry.postingDate}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">Total Amount</label>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            {Number(entry.totalAmount).toLocaleString('en-US', { style: 'currency', currency: entry.currency || 'USD' })}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">Header Text</label>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {entry.headerText || '-'}
                        </div>
                    </div>
                    {entry.accountingDocumentNumber && (
                        <div className="space-y-1 col-span-full bg-green-50 p-4 rounded-lg border border-green-100">
                            <label className="text-xs font-medium text-green-700 uppercase">Accounting Document Number</label>
                            <div className="flex items-center gap-2 text-green-900 font-bold text-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                {entry.accountingDocumentNumber}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Line Items</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">GL Account</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Cost Center</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Profit Center</th>
                            <th className="px-6 py-3 font-medium text-slate-500">D/C</th>
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Amount</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Text</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {entry.items && entry.items.map((item) => (
                            <tr key={item.ID} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-slate-900 font-medium">{item.glAccount}</td>
                                <td className="px-6 py-3 text-slate-600">{item.costCenter || '-'}</td>
                                <td className="px-6 py-3 text-slate-600">{item.profitCenter || '-'}</td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${item.dcIndicator === 'D' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {item.dcIndicator}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right font-medium text-slate-900">
                                    {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-3 text-slate-600">{item.itemText}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Workflow Logs */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-6">Approval History</h3>
                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {entry.workflowLogs && entry.workflowLogs.map((log, index) => (
                        <div key={log.ID} className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 ${log.action === 'Submit' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                log.action === 'Approve' ? 'bg-green-50 border-green-100 text-green-600' :
                                    log.action === 'Reject' ? 'bg-red-50 border-red-100 text-red-600' :
                                        'bg-slate-50 border-slate-100 text-slate-500'
                                }`}>
                                {log.action === 'Submit' && <Clock className="w-4 h-4" />}
                                {log.action === 'Approve' && <CheckCircle className="w-4 h-4" />}
                                {log.action === 'Reject' && <XCircle className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {log.action} by <span className="text-slate-600">{log.actor}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {new Date(log.timestamp).toLocaleString()}
                                </p>
                                {log.comment && (
                                    <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {log.comment}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!entry.workflowLogs || entry.workflowLogs.length === 0) && (
                        <p className="text-sm text-slate-500 pl-10">No history available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
