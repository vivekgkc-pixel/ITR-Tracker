import { useState } from 'react';
import { Users, ChartBar, Settings as SettingsIcon, LogOut, LayoutDashboard } from 'lucide-react';
import Dashboard from './Dashboard';
import Clients from './Clients';
import Analytics from './Analytics';
import Settings from './Settings';
import './MainApp.css';

function MainApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="main-app">
      <header>
        <div className="header-content">
          <h1>
            <LayoutDashboard className="header-icon" />
            ITR Tracker
          </h1>
          <div className="header-actions">
            <button onClick={onLogout} className="btn btn-secondary">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <Users size={18} />
            Clients
          </button>
          <button
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <ChartBar size={18} />
            Analytics
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'clients' && <Clients />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
}

export default MainApp;
