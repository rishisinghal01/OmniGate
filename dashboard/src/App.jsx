import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Playground from './pages/Playground';
import Metrics from './pages/Metrics';
import CostAnalytics from './pages/CostAnalytics';
import ModelHealth from './pages/ModelHealth';
import LiveLogs from './pages/LiveLogs';
import ApiKeys from './pages/ApiKeys';
import './index.css';

function App() {
  const [activePage, setActivePage] = useState(() => localStorage.getItem('omnigate_page') || 'home');
  const [model, setModel] = useState(() => localStorage.getItem('omnigate_model') || 'mock-test');
  
  const [metrics, setMetrics] = useState(() => {
    const saved = localStorage.getItem('omnigate_metrics');
    return saved ? JSON.parse(saved) : {
      lastRequestTime: 0,
      isCacheHit: false,
      totalRequests: 0,
      cacheHits: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('omnigate_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('omnigate_metrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('omnigate_page', activePage);
  }, [activePage]);

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('omnigate_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('omnigate_logs', JSON.stringify(logs));
  }, [logs]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('apiRequest', (data) => {
      setLogs(prev => [...prev, data].slice(-100));
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isConnected={isConnected} />
      
      <main className="main-content">
        {activePage === 'home' && <Home setActivePage={setActivePage} />}
        {activePage === 'playground' && <Playground model={model} setModel={setModel} setMetrics={setMetrics} />}
        {activePage === 'metrics' && <Metrics metrics={metrics} model={model} />}
        {activePage === 'cost' && <CostAnalytics metrics={metrics} />}
        {activePage === 'health' && <ModelHealth />}
        {activePage === 'logs' && <LiveLogs logs={logs} isConnected={isConnected} />}
        {activePage === 'keys' && <ApiKeys />}
      </main>
    </div>
  );
}

export default App;
