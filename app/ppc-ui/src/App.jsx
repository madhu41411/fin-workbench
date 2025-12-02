import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
    const [requests, setRequests] = useState([]);
    const [formData, setFormData] = useState({
        period: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        companyCode: '1010',
        variant: '',
        reason: '',
        type: 'OPEN'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [companyCodes, setCompanyCodes] = useState([]);
    const [periods, setPeriods] = useState([]);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/odata/v4/posting-period/PostingPeriodRequests?$orderby=createdAt desc');
            setRequests(response.data.value);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const fetchCompanyCodes = async () => {
        try {
            const response = await axios.get('/odata/v4/posting-period/CompanyCodes');
            setCompanyCodes(response.data.value);
            // Set default if available
            if (response.data.value.length > 0 && formData.companyCode === '1010') {
                setFormData(prev => ({ ...prev, companyCode: response.data.value[0].code }));
            }
        } catch (error) {
            console.error('Error fetching company codes:', error);
        }
    };

    const fetchPeriods = async () => {
        try {
            const response = await axios.get('/odata/v4/posting-period/Periods');
            setPeriods(response.data.value);
            // Set default if available
            if (response.data.value.length > 0) {
                setFormData(prev => ({ ...prev, period: response.data.value[0].code }));
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchCompanyCodes();
        fetchPeriods();
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
            const endpoint = formData.type === 'OPEN' ? '/odata/v4/posting-period/openPeriod' : '/odata/v4/posting-period/closePeriod';
            const response = await axios.post(endpoint, {
                period: formData.period,
                year: parseInt(formData.year),
                companyCode: formData.companyCode,
                variant: formData.variant,
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
            const response = await axios.post('/odata/v4/posting-period/closeRequest', { requestId });
            setMessage({ type: 'success', text: response.data.value });
            fetchRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Error closing period' });
        } finally {
            setLoading(false);
        }
    };

    const [selectedRequest, setSelectedRequest] = useState(null);

    const handleSendToSap = async (requestId) => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/odata/v4/posting-period/sendToSap', { requestId });
            setMessage({ type: 'success', text: response.data.value });
            setSelectedRequest(null); // Close modal
            fetchRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Error sending to SAP' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
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
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Request Type</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="OPEN"
                                                checked={formData.type === 'OPEN'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="text-sm text-slate-700">Open Period</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="CLOSE"
                                                checked={formData.type === 'CLOSE'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="text-sm text-slate-700">Close Period</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                                    <select
                                        name="period"
                                        value={formData.period}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        required
                                    >
                                        {periods.length === 0 && <option value="">Select Period</option>}
                                        {periods.map(p => (
                                            <option key={p.code} value={p.code}>
                                                {p.code} - {p.description}
                                            </option>
                                        ))}
                                    </select>
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
                                    <select
                                        name="companyCode"
                                        value={formData.companyCode}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        required
                                    >
                                        {companyCodes.length === 0 && <option value="1010">1010 (Default)</option>}
                                        {companyCodes.map(cc => (
                                            <option key={cc.code} value={cc.code}>
                                                {cc.code} - {cc.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Variant</label>
                                    <input
                                        type="text"
                                        name="variant"
                                        value={formData.variant}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (formData.type === 'OPEN' ? 'Submit Open Request' : 'Submit Close Request')}
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

                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => setSelectedRequest(req)}
                                                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-blue-600 text-sm font-medium rounded-lg transition-colors shadow-sm"
                                                    >
                                                        View Data
                                                    </button>
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* View Data Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Request Data - #{selectedRequest.ticketId}</h3>
                            <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-sm overflow-x-auto">
                                <pre>{JSON.stringify(JSON.parse(selectedRequest.payload || '{}'), null, 2)}</pre>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleSendToSap(selectedRequest.ID)}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send to SAP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
