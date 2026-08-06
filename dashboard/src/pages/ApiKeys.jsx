import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, ShieldAlert } from 'lucide-react';

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [newTeam, setNewTeam] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    try {
      const res = await fetch('http://localhost:3000/v1/admin/keys');
      const data = await res.json();
      setKeys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async (e) => {
    e.preventDefault();
    if (!newTeam) return;
    try {
      await fetch('http://localhost:3000/v1/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: newTeam })
      });
      setNewTeam('');
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteKey = async (id) => {
    try {
      await fetch(`http://localhost:3000/v1/admin/keys/${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="section-header" style={{ background: 'transparent', borderBottom: 'none', padding: '0 0 1.5rem 0' }}>
        <h2 className="section-title">
          <Key size={20} /> API Keys & Access Management
        </h2>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Generate New Key</h3>
        <form onSubmit={createKey} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="chat-input" 
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', flex: 1, padding: '0.75rem 1rem' }}
            placeholder="Enter Team or App Name (e.g., frontend-team, ios-app)" 
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
          />
          <button type="submit" className="primary-btn" disabled={!newTeam}>
            <Plus size={18} /> Create Key
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <table className="health-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>API Key</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading keys...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No API keys found. Create one above.</td></tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 500, color: '#fff' }}>{k.teamName}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {k.key.substring(0, 8)}...{k.key.substring(k.key.length - 4)}
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className="badge hit" style={{ background: 'transparent' }}>Active</span>
                  </td>
                  <td>
                    <button 
                      onClick={() => deleteKey(k.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      title="Revoke Key"
                    >
                      <Trash2 size={16} /> Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <ShieldAlert color="var(--error-color)" />
        <div>
          <h4 style={{ color: 'var(--error-color)', marginBottom: '0.25rem' }}>Security Note</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Revoking a key takes effect instantly. Any application using a revoked key will immediately receive HTTP 401 Unauthorized errors.</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;
