import React, { useState } from 'react';
import { Activity, Terminal, Copy, Check } from 'lucide-react';

const Metrics = ({ metrics, model }) => {
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);

  const getCodeSnippet = () => {
    if (activeTab === 'curl') {
      return `curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-key-123" \\
  -d '{
    "model": "${model}",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`;
    }
    if (activeTab === 'js') {
      return `const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-key-123'
  },
  body: JSON.stringify({
    model: '${model}',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;
    }
    return `import requests

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-key-123'
}

json_data = {
    'model': '${model}',
    'messages': [
        {
            'role': 'user',
            'content': 'Hello!',
        },
    ],
}

response = requests.post(
    'http://localhost:3000/v1/chat/completions', 
    headers=headers, 
    json=json_data
)

print(response.json()['choices'][0]['message']['content'])`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container fade-in">
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '700' }}>API & Metrics</h2>
      
      <div className="metrics-grid">
        <div className="metrics-card glass-panel">
          <div className="section-title" style={{ marginBottom: '1rem' }}>
            <Activity size={20} className="logo-icon" />
            Semantic Cache Performance
          </div>
          
          <div className="metric-row">
            <div className="metric-label">Last Request Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="metric-value">{metrics.lastRequestTime}ms</span>
              {metrics.totalRequests > 0 ? (
                <span className={`badge ${metrics.isCacheHit ? 'hit' : 'miss'}`}>
                  {metrics.isCacheHit ? 'CACHE HIT ⚡' : 'API MISS 🐢'}
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>WAITING</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="metric-row" style={{ padding: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="metric-label" style={{ fontSize: '0.9rem' }}>Total Requests</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{metrics.totalRequests}</div>
            </div>
            <div className="metric-row" style={{ padding: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="metric-label" style={{ fontSize: '0.9rem' }}>Cache Hits</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--success-color)', marginTop: '0.5rem' }}>{metrics.cacheHits}</div>
            </div>
          </div>
        </div>

        <div className="metrics-card glass-panel code-card-full">
          <div className="section-title" style={{ padding: '1.5rem 1.5rem 0' }}>
            <Terminal size={20} className="logo-icon" />
            Integration Snippets
          </div>
          
          <div className="code-tabs">
            <button 
              className={`code-tab ${activeTab === 'curl' ? 'active' : ''}`}
              onClick={() => setActiveTab('curl')}
            >cURL</button>
            <button 
              className={`code-tab ${activeTab === 'js' ? 'active' : ''}`}
              onClick={() => setActiveTab('js')}
            >JavaScript</button>
            <button 
              className={`code-tab ${activeTab === 'py' ? 'active' : ''}`}
              onClick={() => setActiveTab('py')}
            >Python</button>
          </div>

          <div className="code-content">
            <button className="copy-button" onClick={copyToClipboard} title="Copy code">
              {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
            </button>
            <pre style={{ margin: 0 }}>
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
