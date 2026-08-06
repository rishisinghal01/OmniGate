import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal, Activity, Zap, Server } from 'lucide-react';

const LiveLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket on the gateway
    const socket = io('http://localhost:3000');
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('apiRequest', (data) => {
      setLogs(prev => [...prev, data].slice(-100)); // Keep last 100 logs
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    // Auto scroll to bottom
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="page-container fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ marginBottom: '1.5rem', background: 'transparent', borderBottom: 'none', padding: '0 0 1rem 0' }}>
        <h2 className="section-title">
          <Terminal size={20} /> Live Request Stream
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div className="status-dot" style={{ background: isConnected ? 'var(--success-color)' : 'var(--error-color)' }}></div>
          {isConnected ? 'Socket Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div>Time</div>
          <div>Model</div>
          <div>Latency</div>
          <div>Team / Key</div>
          <div>Status</div>
        </div>
        
        {/* Logs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0', fontFamily: '"JetBrains Mono", monospace' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Waiting for requests... Try sending a message in the Playground.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="log-row stagger-1" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', animationDelay: '0s' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  {new Date(log.time).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}
                </div>
                <div style={{ color: '#E5E7EB' }}>{log.model}</div>
                <div>
                  <span style={{ color: log.cache === 'HIT' ? 'var(--success-color)' : 'var(--accent-color)' }}>
                    {log.latency}ms
                  </span>
                  {log.cache === 'HIT' && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>HIT</span>}
                </div>
                <div style={{ color: 'var(--text-dim)' }}>{log.team}</div>
                <div>
                  <span style={{ color: log.status >= 400 ? 'var(--error-color)' : 'var(--success-color)' }}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default LiveLogs;
