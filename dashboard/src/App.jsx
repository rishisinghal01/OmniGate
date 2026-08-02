import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Zap, Bot, User, Copy, Check, Server, Activity } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:3000/v1/chat/completions';
const DEFAULT_API_KEY = 'test-key-123';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am connected through OmniGate. Try sending me a message or switch models above.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('mock-test');
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  
  const [metrics, setMetrics] = useState({
    lastRequestTime: 0,
    isCacheHit: false,
    totalRequests: 0,
    cacheHits: 0
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const startTime = performance.now();
    let cacheStatus = 'MISS';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEFAULT_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      // Read custom cache header
      const xCache = response.headers.get('x-cache');
      if (xCache === 'HIT') cacheStatus = 'HIT';

      const data = await response.json();
      const endTime = performance.now();
      const timeTaken = Math.round(endTime - startTime);

      setMetrics(prev => ({
        lastRequestTime: timeTaken,
        isCacheHit: cacheStatus === 'HIT',
        totalRequests: prev.totalRequests + 1,
        cacheHits: prev.cacheHits + (cacheStatus === 'HIT' ? 1 : 0)
      }));

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else if (data.choices && data.choices[0]) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Network Error: Could not connect to API at ${API_URL}` }]);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel">
        <div className="logo-container">
          <Zap className="logo-icon" size={32} />
          <div className="logo-text">
            Omni<span className="glowing-text">Gate</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--success-color)' }}>
          <Server size={16} /> API Online (Port 3000)
        </div>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        
        {/* Left Panel: Chat Playground */}
        <section className="playground-section glass-panel">
          <div className="section-header">
            <div className="section-title">
              <Bot size={20} className="logo-icon" />
              Playground
            </div>
            <select 
              className="model-selector"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="mock-test">Mock (Free Test)</option>
              <option value="openrouter/inclusionai/ling-3.0-flash:free">OpenRouter: Ling Flash (Free)</option>
              <option value="openrouter/poolside/laguna-s-2.1:free">OpenRouter: Laguna 2.1 (Free)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gpt-4o">OpenAI GPT-4o</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            </select>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className={`avatar ${msg.role}`}>
                  {msg.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="white" />}
                </div>
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="avatar assistant">
                  <Bot size={20} color="white" />
                </div>
                <div className="message-bubble">
                  <div className="loader"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="input-wrapper">
              <input 
                type="text" 
                className="chat-input"
                placeholder="Send a message to the unified API..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                className="send-button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel: Info & Metrics */}
        <section className="info-section">
          
          {/* Metrics Card */}
          <div className="metrics-card glass-panel">
            <div className="section-title" style={{ marginBottom: '0.5rem' }}>
              <Activity size={20} className="logo-icon" />
              Semantic Cache Performance
            </div>
            
            <div className="metric-row">
              <div className="metric-label">
                Last Request Status
              </div>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="metric-row" style={{ padding: '0.75rem' }}>
                <div className="metric-label" style={{ fontSize: '0.85rem' }}>Total Requests</div>
                <div className="metric-value" style={{ fontSize: '1.1rem' }}>{metrics.totalRequests}</div>
              </div>
              <div className="metric-row" style={{ padding: '0.75rem' }}>
                <div className="metric-label" style={{ fontSize: '0.85rem' }}>Total Cache Hits</div>
                <div className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--success-color)' }}>{metrics.cacheHits}</div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
              OmniGate uses Vector Embeddings to detect semantically similar prompts. Try sending the exact same message twice to see the cache hit!
            </p>
          </div>

          {/* Integration Card */}
          <div className="code-card glass-panel">
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
          
        </section>

      </main>
    </div>
  );
}

export default App;
