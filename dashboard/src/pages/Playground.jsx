import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

const API_URL = 'http://localhost:3000/v1/chat/completions';
const DEFAULT_API_KEY = 'test-key-123';

const Playground = ({ model, setModel, setMetrics }) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('omnigate_messages');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Hi! I am connected through OmniGate. Try sending me a message or switch models above.' }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('omnigate_messages', JSON.stringify(messages));
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

  return (
    <div className="page-container fade-in" style={{ height: '100%', padding: 0 }}>
      <section className="playground-section glass-panel" style={{ height: '100%' }}>
        <div className="section-header">
          <div className="section-title">
            <Bot size={20} className="logo-icon" />
            Interactive Playground
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
    </div>
  );
};

export default Playground;
