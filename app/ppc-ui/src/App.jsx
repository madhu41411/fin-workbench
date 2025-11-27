import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
    const [requests, setRequests] = useState([]);
    const [formData, setFormData] = useState({
        period: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        companyCode: '1010',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/odata/v4/posting-period/PostingPeriodRequests?$orderby=createdAt desc');
            setRequests(response.data.value);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/odata/v4/posting-period/openPeriod', {
                period: parseInt(formData.period),
                year: parseInt(formData.year),
                companyCode: formData.companyCode,
                reason: formData.reason
            });
            setMessage({ type: 'success', text: response.data.value });
            fetchRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Error opening period' });
        } finally {
            setLoading(false);
        }
    };

    const handleClosePeriod = async (requestId) => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/odata/v4/posting-period/closePeriod', { requestId });
            setMessage({ type: 'success', text: response.data.value });
            fetchRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Error closing period' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-semibold text-slate-800">Posting Period Control</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Request Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-medium mb-4">Open New Period</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                                    <input
                                        type="number"
                                        name="period"
                                        value={formData.period}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        min="1" max="12"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Code</label>
                                    <input
                                        type="text"
                                        name="companyCode"
                                        value={formData.companyCode}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                                </button>
                            </form>

                            {message && (
                                <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requests List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="text-lg font-medium">Recent Requests</h2>
                                <button onClick={fetchRequests} className="text-slate-500 hover:text-blue-600 transition-colors">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            {requests.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No requests found.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {requests.map((req) => (
                                        <div key={req.ID} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                                                req.status === 'CLOSED' ? 'bg-slate-100 text-slate-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                        <span className="text-sm text-slate-500">#{req.ticketId}</span>
                                                    </div>
                                                    <h3 className="text-base font-medium text-slate-900">
                                                        Period {req.period}/{req.year} - {req.companyCode}
                                                    </h3>
                                                    <p className="text-sm text-slate-600 mt-1">{req.reason}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                                        <span>Created: {new Date(req.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {req.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => handleClosePeriod(req.ID)}
                                                        disabled={loading}
                                                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                                                    >
                                                        Close Period
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
