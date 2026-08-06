import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Playground from './pages/Playground';
import Metrics from './pages/Metrics';
import CostAnalytics from './pages/CostAnalytics';
import ModelHealth from './pages/ModelHealth';
import './index.css';

function App() {
  const [activePage, setActivePage] = useState('home');
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

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <main className="main-content">
        {activePage === 'home' && <Home setActivePage={setActivePage} />}
        {activePage === 'playground' && <Playground model={model} setModel={setModel} setMetrics={setMetrics} />}
        {activePage === 'metrics' && <Metrics metrics={metrics} model={model} />}
        {activePage === 'cost' && <CostAnalytics metrics={metrics} />}
        {activePage === 'health' && <ModelHealth />}
      </main>
    </div>
  );
}

export default App;
