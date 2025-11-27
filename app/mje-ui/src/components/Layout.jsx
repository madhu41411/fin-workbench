import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Bell, User, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            active
                ? "bg-accent/10 text-accent font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
    >
        <Icon className={cn("w-5 h-5", active ? "text-accent" : "text-slate-400 group-hover:text-slate-900")} />
        <span>{label}</span>
    </Link>
);

export default function Layout({ children }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:block">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">F</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">Finance Workbench</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Home"
                        to="/"
                        active={location.pathname === '/'}
                    />
                    <SidebarItem
                        icon={FileText}
                        label="MJE Dashboard"
                        to="/mje/dashboard"
                        active={location.pathname === '/mje/dashboard'}
                    />
                    <SidebarItem
                        icon={FileText}
                        label="Journal Entries"
                        to="/mje/journal-entries"
                        active={location.pathname.startsWith('/mje/journal-entries')}
                    />
                    <SidebarItem
                        icon={Settings}
                        label="Settings"
                        to="/mje/settings"
                        active={location.pathname === '/mje/settings'}
                    />
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">User</p>
                            <p className="text-xs text-slate-500 truncate">user@example.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-slate-800">
                        {location.pathname === '/' ? 'Dashboard' :
                            location.pathname.startsWith('/journal-entries') ? 'Journal Entries' : 'Page'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <Link to="/mje/inbox" className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors relative" title="My Inbox">
                            <Inbox className="w-5 h-5" />
                        </Link>
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
