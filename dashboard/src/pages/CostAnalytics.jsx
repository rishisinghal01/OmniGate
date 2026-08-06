import React from 'react';
import { DollarSign, TrendingDown, PieChart, Wallet, CreditCard } from 'lucide-react';

const CostAnalytics = ({ metrics }) => {
  // Using some mock logic based on real hits for visualization
  const averageCostPerReq = 0.002; // $0.002 per request average
  const totalCostIfNoCache = (metrics.totalRequests * averageCostPerReq).toFixed(4);
  const costSaved = (metrics.cacheHits * averageCostPerReq).toFixed(4);
  const actualCost = (totalCostIfNoCache - costSaved).toFixed(4);

  return (
    <div className="page-container fade-in">
      <div className="section-header" style={{ border: 'none', padding: '0 0 1.5rem 0' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DollarSign size={28} className="logo-icon" /> Cost Analytics
        </h2>
      </div>

      {/* Top Highlight Cards */}
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

      {/* Mock Chart Area */}
      <div className="features-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '2rem' }}>
        
        {/* Large Chart Area */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem' }}>
            Token Usage Over Time (Last 30 Days)
          </div>
          {/* CSS Mock Chart */}
          <div className="mock-chart">
            <div className="chart-bar" style={{ height: '40%' }}></div>
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '30%' }}></div>
            <div className="chart-bar" style={{ height: '80%' }}></div>
            <div className="chart-bar" style={{ height: '50%' }}></div>
            <div className="chart-bar" style={{ height: '90%' }}></div>
            <div className="chart-bar" style={{ height: '20%' }}></div>
            <div className="chart-bar" style={{ height: '70%' }}></div>
            <div className="chart-bar" style={{ height: '45%' }}></div>
            <div className="chart-bar" style={{ height: '85%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
            <span>May 1</span>
            <span>May 15</span>
            <span>May 30</span>
          </div>
        </div>

        {/* Usage Breakdown */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem' }}>
            <PieChart size={20} className="logo-icon" /> Team Breakdown
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="breakdown-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Demo Team</span>
                <span style={{ color: 'var(--text-muted)' }}>65%</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: '65%', background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}></div>
              </div>
            </div>

            <div className="breakdown-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Marketing API</span>
                <span style={{ color: 'var(--text-muted)' }}>25%</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: '25%', background: 'linear-gradient(90deg, #ec4899, #f43f5e)' }}></div>
              </div>
            </div>

            <div className="breakdown-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Support Bot</span>
                <span style={{ color: 'var(--text-muted)' }}>10%</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: '10%', background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CostAnalytics;
