import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter, MoreHorizontal, FileText } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        Draft: "bg-slate-100 text-slate-600",
        Pending: "bg-yellow-50 text-yellow-600",
        Approved: "bg-green-50 text-green-600",
        Rejected: "bg-red-50 text-red-600",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.Draft}`}>
            {status}
        </span>
    );
};

export default function JournalEntries() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const response = await axios.get('/odata/v4/mje/JournalEntries?$orderby=createdAt desc');
            const mappedEntries = response.data.value.map(entry => ({
                id: entry.ID, // Or entry.documentNumber if available, but ID is UUID
                company: entry.companyCode,
                date: entry.postingDate,
                amount: Number(entry.totalAmount || 0),
                status: entry.status,
                text: entry.headerText
            }));
            setEntries(mappedEntries);
        } catch (error) {
            console.error("Failed to fetch entries:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Journal Entries</h2>
                    <p className="text-slate-500">Manage and track your manual journal entries</p>
                </div>
                <Link
                    to="/journal-entries/new"
                    className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
                >
                    <Plus className="w-4 h-4" />
                    New Entry
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search entries..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900">Document ID</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Company</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Posting Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Header Text</th>
                            <th className="px-6 py-4 font-semibold text-slate-900 text-right">Amount</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-900"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-accent">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <Link to={`/journal-entries/${entry.id}`} className="hover:underline">
                                            {entry.id}
                                        </Link>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{entry.company}</td>
                                <td className="px-6 py-4 text-slate-600">{entry.date}</td>
                                <td className="px-6 py-4 text-slate-600">{entry.text}</td>
                                <td className="px-6 py-4 text-slate-900 font-medium text-right">
                                    {entry.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={entry.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
