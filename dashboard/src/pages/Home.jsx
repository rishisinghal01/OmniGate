import React from 'react';
import { Shield, Zap, Database, ArrowRight, Layers, Terminal, Code2, Globe, Cpu, Command } from 'lucide-react';

const Home = ({ setActivePage }) => {
  return (
    <div className="page-container fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* 1. Grand Hero Section */}
      <div className="hero-section stagger-1" style={{ minHeight: '80vh', justifyContent: 'center' }}>
        <div className="hero-badge" style={{ marginBottom: '2rem' }}>
          <Zap size={14} style={{ display: 'inline', marginRight: '8px' }} />
          OmniGate v1.0 is Live
        </div>
        <h1 className="hero-title" style={{ maxWidth: '900px' }}>
          The Engine for <br/><span>Generative AI</span>
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', marginTop: '1.5rem', maxWidth: '700px' }}>
          A lightning-fast, edge-optimized API Gateway that slashes LLM costs by 99% with Semantic Caching and guarantees zero downtime with Automated Failover.
        </p>
        <div className="hero-actions" style={{ marginTop: '2.5rem' }}>
          <button className="primary-btn" onClick={() => setActivePage('playground')}>
            Open Playground <ArrowRight size={18} />
          </button>
          <button className="secondary-btn" onClick={() => setActivePage('metrics')}>
            View Documentation
          </button>
        </div>
      </div>

      {/* 2. Supported Models Ticker */}
      <div className="stagger-2" style={{ margin: '2rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Natively Supports Every Major Provider
        </p>
        <div className="model-ticker-container glass-panel">
          <div className="model-ticker">
            <span><Cpu size={16} /> OpenAI GPT-4o</span>
            <span><Globe size={16} /> Anthropic Claude 3.5</span>
            <span><Command size={16} /> Google Gemini 1.5</span>
            <span><Code2 size={16} /> Meta Llama 3</span>
            <span><Terminal size={16} /> Mistral Large</span>
            <span><Cpu size={16} /> OpenAI GPT-4o</span>
            <span><Globe size={16} /> Anthropic Claude 3.5</span>
            <span><Command size={16} /> Google Gemini 1.5</span>
          </div>
        </div>
      </div>

      {/* 3. Core Features Grid */}
      <div className="stagger-3" style={{ marginTop: '8rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="section-heading">Built for Scale</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Everything you need to ship AI apps in production.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Database size={24} />
            </div>
            <h3>Semantic Caching</h3>
            <p>Utilizes Vector Embeddings to instantly serve cached responses for semantically identical prompts. Save up to 99% on token costs and reduce latency to sub-10ms.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Layers size={24} />
            </div>
            <h3>Automated Failover</h3>
            <p>Never experience downtime. OmniGate automatically routes failing requests (429s, 500s) from primary providers to fallbacks like Claude or Gemini in milliseconds.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Shield size={24} />
            </div>
            <h3>Dynamic Rate Limiting</h3>
            <p>Enterprise-grade Redis Token Bucket algorithm ensures fair usage. Easily manage API keys, quotas, and strict limits across multiple teams and environments.</p>
          </div>
        </div>
      </div>

      {/* 4. How it Works Section */}
      <div className="stagger-4" style={{ marginTop: '8rem' }}>
        <div className="glass-panel" style={{ padding: '4rem', display: 'flex', alignItems: 'center', gap: '4rem' }}>
          <div style={{ flex: 1 }}>
            <div className="hero-badge" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>Developer Experience</div>
            <h2 className="section-heading" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>One Line of Code.</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
              You don't need to rewrite your entire application. Simply change your API Base URL to point to OmniGate, and keep using the exact same OpenAI SDKs you already know. We handle the heavy lifting behind the scenes.
            </p>
            <ul className="feature-list">
              <li><Zap size={18}/> Drop-in replacement for OpenAI API</li>
              <li><Zap size={18}/> Universal format for Anthropic & Gemini</li>
              <li><Zap size={18}/> Built-in telemetry and observability</li>
            </ul>
          </div>
          <div style={{ flex: 1 }} className="code-content">
            <div style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>// Just change your baseURL</div>
            <pre style={{ margin: 0 }}>
<span style={{ color: '#ff7b72' }}>import</span> OpenAI <span style={{ color: '#ff7b72' }}>from</span> <span style={{ color: '#a5d6ff' }}>'openai'</span>;{'\n\n'}
<span style={{ color: '#ff7b72' }}>const</span> client = <span style={{ color: '#ff7b72' }}>new</span> OpenAI({'{'}{'\n'}
{'  '}baseURL: <span style={{ color: '#a5d6ff' }}>'http://localhost:3000/v1'</span>,{'\n'}
{'  '}apiKey: <span style={{ color: '#a5d6ff' }}>'test-key-123'</span>{'\n'}
{'}'});{'\n\n'}
<span style={{ color: '#ff7b72' }}>const</span> response = <span style={{ color: '#ff7b72' }}>await</span> client.chat.completions.create({'{'}{'\n'}
{'  '}model: <span style={{ color: '#a5d6ff' }}>'gpt-4o'</span>,{'\n'}
{'  '}messages: [{'{'} role: <span style={{ color: '#a5d6ff' }}>'user'</span>, content: <span style={{ color: '#a5d6ff' }}>'Hello'</span> {'}'}]{'\n'}
{'}'});
            </pre>
          </div>
        </div>
      </div>

      {/* 5. Stats Section */}
      <div className="stats-section glass-panel stagger-1" style={{ animationDelay: '0.5s', marginTop: '8rem' }}>
        <div className="stat-box">
          <div className="stat-value">{'<'} 10ms</div>
          <div className="stat-label">Cache Hit Latency</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">99%</div>
          <div className="stat-label">Cost Reduction</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">100%</div>
          <div className="stat-label">Uptime Guaranteed</div>
        </div>
      </div>

      {/* 6. Grand CTA Footer */}
      <div className="stagger-2" style={{ animationDelay: '0.6s', marginTop: '8rem', textAlign: 'center', padding: '6rem 0' }}>
        <h2 className="section-heading" style={{ marginBottom: '2rem' }}>Ready to Supercharge your AI?</h2>
        <button className="primary-btn" onClick={() => setActivePage('health')} style={{ margin: '0 auto' }}>
          View Real-time Failover <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
};

export default Home;
