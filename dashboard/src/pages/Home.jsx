import React from 'react';
import { Shield, Zap, Database, ArrowRight, Layers, Activity } from 'lucide-react';

const Home = ({ setActivePage }) => {
  return (
    <div className="page-container fade-in">
      <div className="hero-section">
        <div className="hero-badge">Enterprise Ready v1.0</div>
        <h1 className="hero-title">
          The Ultimate <span className="glowing-text">AI API Gateway</span>
        </h1>
        <p className="hero-subtitle">
          Optimize LLM requests with edge-level semantic caching, automated multi-model failover, and intelligent rate limiting. Built for scale, designed for perfection.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => setActivePage('playground')}>
            Try Playground <ArrowRight size={18} />
          </button>
          <button className="secondary-btn" onClick={() => setActivePage('metrics')}>
            View API Docs
          </button>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card glass-panel">
          <div className="feature-icon-wrapper pulse-glow">
            <Database size={28} color="var(--primary-color)" />
          </div>
          <h3>Semantic Caching</h3>
          <p>Utilizes Gemini Embeddings and Redis Vector Search to instantly serve cached responses for semantically identical prompts, saving 99% cost.</p>
        </div>

        <div className="feature-card glass-panel">
          <div className="feature-icon-wrapper" style={{ boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)' }}>
            <Layers size={28} color="var(--secondary-color)" />
          </div>
          <h3>Automated Failover</h3>
          <p>Never experience downtime. Automatically routes failing requests from OpenAI to Claude or Gemini in milliseconds with zero configuration.</p>
        </div>

        <div className="feature-card glass-panel">
          <div className="feature-icon-wrapper" style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
            <Shield size={28} color="var(--success-color)" />
          </div>
          <h3>Dynamic Rate Limiting</h3>
          <p>Enterprise-grade Redis Token Bucket algorithm ensures fair usage and prevents API abuse across multiple teams with DB-backed API keys.</p>
        </div>
      </div>

      <div className="stats-section glass-panel">
        <div className="stat-box">
          <div className="stat-value glowing-text">{'<'} 10ms</div>
          <div className="stat-label">Cache Hit Latency</div>
        </div>
        <div className="stat-box">
          <div className="stat-value glowing-text">100%</div>
          <div className="stat-label">Uptime via Failover</div>
        </div>
        <div className="stat-box">
          <div className="stat-value glowing-text">3072</div>
          <div className="stat-label">Vector Dimensions</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
