import React from 'react';
import { Link } from 'react-router-dom';
import { Search, LayoutDashboard, Calendar, Plus, ArrowRight } from 'lucide-react';

const ModuleCard = ({ title, description, icon: Icon, to, color, comingSoon, external }) => {
    const Component = external ? 'a' : Link;
    const props = external ? { href: to } : { to: to || '#' };

    return (
        <Component
            {...props}
            className={`group relative block p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ${comingSoon ? 'cursor-default opacity-75' : 'hover:-translate-y-1'}`}
            onClick={e => comingSoon && e.preventDefault()}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {title}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
                {description}
            </p>
            {comingSoon ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Coming Soon
                </span>
            ) : (
                <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Module <ArrowRight className="w-4 h-4 ml-1" />
                </div>
            )}
        </Component>
    );
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-12">
                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
                        <span className="text-white font-bold text-3xl">F</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        Finance Workbench
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Your central hub for financial operations, journal entries, and period controls.
                    </p>
                </div>

                {/* Search Bar (Visual Only) */}
                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-white rounded-full shadow-sm border border-slate-200 flex items-center p-2 pl-6 hover:shadow-md transition-shadow">
                        <Search className="w-5 h-5 text-slate-400 mr-4" />
                        <input
                            type="text"
                            placeholder="Ask anything about your finance data..."
                            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 h-10"
                        />
                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                            Search
                        </button>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ModuleCard
                        title="MJE Management"
                        description="Create, approve, and post manual journal entries to SAP S/4HANA."
                        icon={LayoutDashboard}
                        to="/mje/dashboard"
                        color="bg-blue-500"
                    />
                    <ModuleCard
                        title="Posting Period Control"
                        description="Manage open and closed posting periods for company codes."
                        icon={Calendar}
                        to="/app/ppc-ui/"
                        color="bg-purple-500"
                        external
                    />
                    <div className="group relative block p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Add Module</h3>
                        <p className="text-slate-500 text-sm">Customize your workbench</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 max-w-2xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="p-1 bg-amber-100 rounded-full">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Disclaimer: Experimental Use Only</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            This application is a prototype for demonstration purposes. <strong>No internal or confidential data has been used.</strong> All data presented is mock or synthetic.
                        </p>
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-slate-400 text-sm">
                © 2025 Finance Workbench • Powered by SAP BTP Finance COE
            </footer>
        </div>
    );
}
