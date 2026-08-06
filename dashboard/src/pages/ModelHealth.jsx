import React, { useState, useEffect } from 'react';
import { Activity, Server, ArrowRightLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

const ModelHealth = () => {
  // Mocking real-time fluctuating health
  const [healthData, setHealthData] = useState([
    { provider: 'OpenAI (GPT-4o)', status: 'operational', latency: 120, uptime: '99.98%' },
    { provider: 'Anthropic (Claude 3)', status: 'degraded', latency: 850, uptime: '98.45%' },
    { provider: 'Google (Gemini 2.5)', status: 'operational', latency: 190, uptime: '100%' },
    { provider: 'OpenRouter (Llama 3)', status: 'down', latency: 0, uptime: '94.20%' },
  ]);

  // Simulate real-time pings changing statuses slightly
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(prev => prev.map(model => {
        if (model.status === 'down') return model;
        
        const latencyWobble = Math.floor(Math.random() * 40) - 20; // -20 to +20
        let newLatency = Math.max(50, model.latency + latencyWobble);
        
        let newStatus = model.status;
        if (newLatency > 800) newStatus = 'degraded';
        else if (newLatency < 600) newStatus = 'operational';

        return { ...model, latency: newLatency, status: newStatus };
      }));
    }, 3000);
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
