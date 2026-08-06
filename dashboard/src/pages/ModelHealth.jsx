import React, { useState, useEffect } from 'react';
import { Activity, Server, ArrowRightLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

const ModelHealth = () => {
  const [metrics, setMetrics] = useState({ uptime: 0, memoryUsedMB: 0, totalRequests: 0, status: 'connecting...' });
  const [healthData, setHealthData] = useState([
    { provider: 'OpenAI (GPT-4o)', status: 'operational', latency: 120, uptime: '99.98%' },
    { provider: 'Anthropic (Claude 3)', status: 'degraded', latency: 850, uptime: '98.45%' },
    { provider: 'Google (Gemini 2.5)', status: 'operational', latency: 190, uptime: '100%' },
    { provider: 'OpenRouter (Llama 3)', status: 'down', latency: 0, uptime: '94.20%' },
  ]);

  useEffect(() => {
    // Poll real server metrics
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:3000/v1/admin/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (e) {
        setMetrics(prev => ({ ...prev, status: 'offline' }));
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'operational': return <span className="badge hit"><CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/>Operational</span>;
      case 'degraded': return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Degraded</span>;
      case 'down': return <span className="badge miss"><ShieldAlert size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/>Down</span>;
      default: return <span className="badge">Unknown</span>;
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="section-header" style={{ border: 'none', padding: '0 0 1.5rem 0' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={28} className="logo-icon" /> Model Health & Routing
        </h2>
      </div>

      <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        <div className="stats-section glass-panel stagger-1" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="stat-box">
            <div className="stat-value" style={{ fontSize: '2rem' }}>{metrics.uptime}s</div>
            <div className="stat-label">Gateway Uptime</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ fontSize: '2rem', color: metrics.status === 'offline' ? 'var(--error-color)' : 'var(--success-color)' }}>
              {metrics.status === 'offline' ? 'Offline' : 'Operational'}
            </div>
            <div className="stat-label">System Status</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ fontSize: '2rem' }}>{metrics.memoryUsedMB} MB</div>
            <div className="stat-label">Memory Usage</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ fontSize: '2rem' }}>{metrics.totalRequests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>

        {/* Failover Visualizer */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem' }}>
            <ArrowRightLeft size={20} className="logo-icon" /> Live Failover Routing
          </div>
          
          <div className="failover-diagram">
            <div className="diagram-node user-node">Client App</div>
            <div className="diagram-arrow pulse-arrow"></div>
            <div className="diagram-node gateway-node pulse-glow">OmniGate</div>
            
            <div className="diagram-split">
              <div className="diagram-path failed-path">
                <div className="diagram-arrow red-arrow"></div>
                <div className="diagram-node error-node">OpenAI (429 Rate Limit)</div>
              </div>
              <div className="diagram-path success-path">
                <div className="diagram-arrow green-arrow delay-arrow"></div>
                <div className="diagram-node success-node">Claude 3 (Fallback Hit)</div>
              </div>
            </div>
          </div>
          
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
            OmniGate detects the 429 Rate Limit from OpenAI and instantly redirects the payload to Anthropic, ensuring the Client App receives a 200 OK response with zero downtime.
          </p>
        </div>

        {/* Status Table */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="section-header" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem 2rem' }}>
            <div className="section-title">
              <Server size={20} /> Edge Provider Status
            </div>
          </div>
          
          <table className="health-table">
            <thead>
              <tr>
                <th>Provider Model</th>
                <th>Status</th>
                <th>Latency (Ping)</th>
                <th>30-Day Uptime</th>
              </tr>
            </thead>
            <tbody>
              {healthData.map((data, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{data.provider}</td>
                  <td>{getStatusBadge(data.status)}</td>
                  <td style={{ fontFamily: 'monospace', color: data.status === 'down' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    {data.status === 'down' ? 'Timeout' : `${data.latency}ms`}
                  </td>
                  <td>{data.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ModelHealth;
