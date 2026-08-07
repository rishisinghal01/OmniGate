import React from 'react';
import { Home, Bot, Activity, Zap, Server, Key, Terminal } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, isConnected }) => {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'playground', label: 'Playground', icon: Bot },
    { id: 'metrics', label: 'API Metrics', icon: Activity },
    { id: 'cost', label: 'Cost Analytics', icon: Zap },
    { id: 'health', label: 'Model Health', icon: Server },
    { id: 'logs', label: 'Live Logs', icon: Terminal },
    { id: 'keys', label: 'API Keys', icon: Key },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Zap className="logo-icon" size={32} />
        <div className="logo-text">
          Omni<span className="glowing-text">Gate</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
              {isActive && <div className="nav-indicator" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className={`status-dot ${isConnected ? 'online' : ''}`} style={{ background: isConnected ? '' : 'var(--error-color)' }}></div>
          <span>{isConnected ? 'Gateway Online' : 'Gateway Offline'}</span>
        </div>
        <div className="status-port">
          <Server size={14} /> Port 3000
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
