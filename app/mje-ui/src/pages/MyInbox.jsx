import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyInbox() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null); // ID of task being processed
    const [comment, setComment] = useState('');
    const [actionTask, setActionTask] = useState(null); // Task selected for action (approve/reject)
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get("/odata/v4/mje/JournalEntries?$filter=status eq 'Pending'&$orderby=createdAt desc");
            setTasks(response.data.value);
        } catch (error) {
            console.error("Failed to fetch inbox tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (task, type) => {
        setActionTask(task);
        setActionType(type);
        setComment('');
    };

    const handleSubmitAction = async () => {
        if (!actionTask || !actionType) return;

        setProcessing(actionTask.ID);
        try {
            const endpoint = actionType === 'approve' ? 'approve' : 'reject';
            await axios.post(`/odata/v4/mje/JournalEntries(${actionTask.ID})/MJEService.${endpoint}`, {
                comment: comment
            });

            // Remove task from list
            setTasks(prev => prev.filter(t => t.ID !== actionTask.ID));
            setActionTask(null);
            setActionType(null);
        } catch (error) {
            console.error(`Failed to ${actionType} task:`, error);
            alert(`Failed to ${actionType} task. Please try again.`);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading inbox...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Inbox</h1>
                <p className="text-slate-500">Manage your pending approval requests</p>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                    <p className="text-slate-500 mt-1">You have no pending approvals.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <div key={task.ID} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium border border-yellow-100">
                                            Pending Approval
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        {task.headerText || 'Journal Entry'}
                                    </h3>
                                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-slate-600">
                                        <div>
                                            <span className="text-slate-400">Company:</span> {task.companyCode}
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Amount:</span>
                                            <span className="font-medium text-slate-900 ml-1">
                                                {Number(task.totalAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Link to={`/journal-entries/${task.ID}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                            View Details <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleActionClick(task, 'approve')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center w-32"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleActionClick(task, 'reject')}
                                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center w-32"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            {actionTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            {actionType === 'approve' ? 'Approve Journal Entry' : 'Reject Journal Entry'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4">
                            {actionType === 'approve'
                                ? 'Are you sure you want to approve this entry? It will be ready for posting.'
                                : 'Please provide a reason for rejection.'}
                        </p>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add a comment (optional)..."
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] mb-4"
                            autoFocus
                        />

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => { setActionTask(null); setActionType(null); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAction}
                                disabled={processing === actionTask.ID}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {processing === actionTask.ID && <Clock className="w-4 h-4 animate-spin" />}
                                {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
