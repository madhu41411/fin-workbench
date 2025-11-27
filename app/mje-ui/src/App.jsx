import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JournalEntries from './pages/JournalEntries';
import CreateJournalEntry from './pages/CreateJournalEntry';
import JournalEntryDetails from './pages/JournalEntryDetails';
import MyInbox from './pages/MyInbox';

import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router basename="/app/mje-ui">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/mje/*" element={
          <Layout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="journal-entries" element={<JournalEntries />} />
              <Route path="journal-entries/new" element={<CreateJournalEntry />} />
              <Route path="journal-entries/:id" element={<JournalEntryDetails />} />
              <Route path="inbox" element={<MyInbox />} />
              <Route path="settings" element={<div className="text-slate-500">Settings Page (Coming Soon)</div>} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
