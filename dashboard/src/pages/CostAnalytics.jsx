import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, PieChart, Wallet, CreditCard, Activity } from 'lucide-react';

const CostAnalytics = ({ metrics }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:3000/v1/admin/analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch immediately and poll every 5 seconds
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="page-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loader"></div>
      </div>
    );
  }

  const actualCost = analytics.actualCost.toFixed(4);
  const costSaved = analytics.costSaved.toFixed(4);
  const totalCostIfNoCache = (analytics.actualCost + analytics.costSaved).toFixed(4);

  // Generate CSS mock chart from real data
  const days = Object.keys(analytics.usageByDay || {}).slice(-10); // last 10 days
  const maxUsage = Math.max(...days.map(d => analytics.usageByDay[d]), 1); // Avoid div by 0

  return (
    <div className="page-container fade-in">
      <div className="section-header" style={{ border: 'none', padding: '0 0 1.5rem 0' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DollarSign size={28} className="logo-icon" /> Cost Analytics
        </h2>
      </div>

      <div className="stats-section glass-panel" style={{ marginTop: '0', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        <div className="stat-box" style={{ textAlign: 'left', borderRight: '1px solid var(--border-color)' }}>
          <div className="stat-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={16} /> Actual API Spend
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem' }}>${actualCost}</div>
        </div>
        
        <div className="stat-box" style={{ textAlign: 'left', borderRight: '1px solid var(--border-color)' }}>
          <div className="stat-label" style={{ marginBottom: '0.5rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={16} /> Total Savings (Cache)
          </div>
          <div className="stat-value glowing-text" style={{ fontSize: '2.5rem' }}>${costSaved}</div>
        </div>

        <div className="stat-box" style={{ textAlign: 'left' }}>
          <div className="stat-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={16} /> Without OmniGate
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem', opacity: 0.6, textDecoration: 'line-through' }}>${totalCostIfNoCache}</div>
        </div>
      </div>

      <div className="features-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Token Usage Over Time (Last 10 Days)</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{analytics.totalTokens.toLocaleString()} Total Tokens</span>
          </div>
          
          <div className="mock-chart">
            {days.length === 0 ? (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                 <Activity size={32} style={{ opacity: 0.5, marginRight: '1rem' }} /> No data yet
               </div>
            ) : (
               days.map((day, idx) => {
                 const height = `${Math.max((analytics.usageByDay[day] / maxUsage) * 100, 5)}%`;
                 return (
                   <div key={day} className="chart-bar" style={{ height }} title={`${day}: ${analytics.usageByDay[day]} tokens`}></div>
                 );
               })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
            {days.length > 0 ? (
              <>
                <span>{days[0]}</span>
                <span>{days[Math.floor(days.length/2)]}</span>
                <span>{days[days.length-1]}</span>
              </>
            ) : (
              <span>Start making requests to see data</span>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem' }}>
            <PieChart size={20} className="logo-icon" /> Team Breakdown
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.keys(analytics.teamUsage).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No team data available</div>
            ) : (
              Object.entries(analytics.teamUsage)
                .sort((a, b) => b[1] - a[1]) // Sort by usage descending
                .map(([team, usage], idx) => {
                  const percent = Math.round((usage / analytics.totalTokens) * 100) || 0;
                  const colors = [
                    'linear-gradient(90deg, #6366f1, #a855f7)',
                    'linear-gradient(90deg, #ec4899, #f43f5e)',
                    'linear-gradient(90deg, #10b981, #3b82f6)',
                    'linear-gradient(90deg, #f59e0b, #ef4444)'
                  ];
                  const bg = colors[idx % colors.length];
                  
                  return (
                    <div key={team} className="breakdown-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{team}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{percent}%</span>
                      </div>
                      <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${percent}%`, background: bg }}></div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CostAnalytics;
