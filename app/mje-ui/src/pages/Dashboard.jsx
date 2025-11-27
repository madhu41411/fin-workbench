import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-lg", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            {trend && (
                <span className={cn("text-sm font-medium", trend > 0 ? "text-green-600" : "text-red-600")}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
);

import axios from 'axios';

export default function Dashboard() {
    const [stats, setStats] = useState([
        { name: 'Draft', value: 0, color: '#94a3b8' },
        { name: 'Pending', value: 0, color: '#eab308' },
        { name: 'Approved', value: 0, color: '#22c55e' },
        { name: 'Rejected', value: 0, color: '#ef4444' },
    ]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch Stats
            const statsResponse = await axios.get('/odata/v4/mje/getDashboardStats()');
            if (statsResponse.data && statsResponse.data.value) {
                const parsedStats = JSON.parse(statsResponse.data.value);
                // parsedStats is array of { status: '...', count: ... }

                const newStats = stats.map(s => {
                    const found = parsedStats.find(p => p.status === s.name);
                    return { ...s, value: found ? found.count : 0 };
                });
                setStats(newStats);
            }

            // Fetch Recent Activity
            const activityResponse = await axios.get('/odata/v4/mje/JournalEntries?$top=5&$orderby=createdAt desc');
            setRecentActivity(activityResponse.data.value);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Entries"
                    value={stats.reduce((acc, curr) => acc + curr.value, 0)}
                    icon={TrendingUp}
                    color="bg-blue-500"
                // trend={12} // Removed hardcoded trend
                />
                <StatCard
                    title="Pending Approval"
                    value={stats.find(s => s.name === 'Pending')?.value || 0}
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Approved"
                    value={stats.find(s => s.name === 'Approved')?.value || 0}
                    icon={CheckCircle}
                    color="bg-green-500"
                />
                <StatCard
                    title="Rejected"
                    value={stats.find(s => s.name === 'Rejected')?.value || 0}
                    icon={XCircle}
                    color="bg-red-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Entry Status Overview</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.map((entry) => (
                            <div key={entry.ID} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    JE
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Journal Entry #{entry.ID.substring(0, 8)} created</p>
                                    <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()} • by {entry.createdBy || 'User'}</p>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">New</span>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
