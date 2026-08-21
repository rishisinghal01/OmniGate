import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import { connectRedis, getEmbedding, findSimilarCache, saveToCache } from './cache.js';
import { prisma } from './db.js';
import { checkRateLimit } from './rateLimit.js';
import { Readable } from 'stream';

dotenv.config();

const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const serverStartTime = Date.now();
let totalRequestsProcessed = 0;

const PRICING_TABLE: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 5.0, completion: 15.0 }, // per 1M tokens
  'claude-3-opus-20240229': { prompt: 15.0, completion: 75.0 },
  'gemini-2.5-flash': { prompt: 0.075, completion: 0.30 },
  'mock-test': { prompt: 0, completion: 0 },
  'openrouter/poolside/laguna-s-2.1:free': { prompt: 1000.0, completion: 2000.0 }, // Exaggerated mock cost for testing dashboard
  'openrouter/nvidia/nemotron-3.5-lightning:free': { prompt: 1000.0, completion: 2000.0 }, // Exaggerated mock cost for testing dashboard
};

function calculateCost(model: string, promptTokens: number, completionTokens: number) {
  const pricing = PRICING_TABLE[model] || { prompt: 0, completion: 0 };
  return (promptTokens * pricing.prompt / 1000000) + (completionTokens * pricing.completion / 1000000);
}

async function logRequest(data: { time: number, latency: number, status: number, model: string, cache: string, team: string, promptTokens?: number, completionTokens?: number, totalTokens?: number, cost?: number }) {
  io.emit('apiRequest', data);
  prisma.requestLog.create({
    data: {
      model: data.model,
      latency: data.latency,
      status: data.status,
      teamName: data.team,
      cacheHit: data.cache === 'HIT',
      promptTokens: data.promptTokens || 0,
      completionTokens: data.completionTokens || 0,
      totalTokens: data.totalTokens || 0,
      cost: data.cost || 0
    }
  }).catch(e => console.error("Log save error:", e));
}


app.use(cors({ exposedHeaders: ['x-cache'] }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('OmniGate API is running! 🚀 Send a POST request to /v1/chat/completions to interact.');
});

async function fetchMock(body: any) {
  console.log("Routing to Mock...");
  if (body.stream) {
    const text = "Bhai yeh ek mock response hai! Aapka gateway ekdum mast kaam kar raha hai bina kisi API key ke! 🚀";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        let i = 0;
        const words = text.split(' ');
        const interval = setInterval(() => {
          if (i >= words.length) {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
            clearInterval(interval);
            return;
          }
          const chunk = {
            id: "mock-" + Date.now(),
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: body.model,
            choices: [{ delta: { content: words[i] + ' ' }, index: 0, finish_reason: null }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          i++;
        }, 50);
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  }

  return new Response(JSON.stringify({
    id: "mock-" + Date.now(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: body.model,
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Bhai yeh ek mock response hai! Aapka gateway ekdum mast kaam kar raha hai bina kisi API key ke! 🚀"
        },
        finish_reason: "stop"
      }
    ]
  }), { headers: { 'Content-Type': 'application/json' } });
}

async function fetchOpenAI(body: any) {
  const openaiKey = process.env.OPENAI_API_KEY;
  console.log("Routing to OpenAI...");
  const payload = { ...body };
  if (payload.stream) {
    payload.stream_options = { include_usage: true };
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API Error: ${err}`);
  }
  return response;
}

async function fetchClaude(body: any) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  console.log("Routing to Claude...");
  let systemPrompt = "";
  const filteredMessages = body.messages.filter((m: any) => {
    if (m.role === 'system') {
      systemPrompt = m.content;
      return false;
    }
    return true;
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey || '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: body.model,
      max_tokens: body.max_tokens || 1024,
      system: systemPrompt,
      messages: filteredMessages,
      stream: body.stream
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API Error: ${err}`);
  }
  return response;
}

async function fetchGemini(body: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log("Routing to Gemini...");
  const geminiContents = body.messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user', 
    parts: [{ text: m.content }]
  }));

  const isStream = body.stream;
  const endpoint = isStream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:${endpoint}&key=${geminiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: geminiContents })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${err}`);
  }
  return response;
}

async function fetchOpenRouter(body: any) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  console.log("Routing to OpenRouter...");
  let targetModel = body.model;
  if (targetModel.startsWith('openrouter/')) {
    targetModel = targetModel.replace('openrouter/', '');
  }
  const payload = { ...body, model: targetModel };
  if (payload.stream) {
    payload.stream_options = { include_usage: true };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'OmniGate'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API Error: ${err}`);
  }
  return response;
}

async function callProvider(model: string, body: any): Promise<Response> {
  const payload = { ...body, model };
  if (model.startsWith('gpt')) return await fetchOpenAI(payload);
  if (model.startsWith('claude')) return await fetchClaude(payload);
  if (model.startsWith('gemini')) return await fetchGemini(payload);
  if (model.startsWith('mock')) return await fetchMock(payload);
  if (model.startsWith('openrouter/')) return await fetchOpenRouter(payload);
  throw new Error(`Unknown model: ${model}`);
}

app.post('/v1/chat/completions', async (req, res) => {
  const requestStartTime = performance.now();
  totalRequestsProcessed++;
  let finalStatus = 200;
  let cacheHit = false;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      finalStatus = 401;
      logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: finalStatus, model: req.body?.model || 'unknown', cache: 'MISS', team: 'unknown' });
      return res.status(401).json({ error: "No API key provided!" });
    }

    const token = authHeader.split(' ')[1];
    const apiKey = await prisma.apiKey.findUnique({ where: { key: token } });

    if (!apiKey || !apiKey.isActive) {
      finalStatus = 401;
      logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: finalStatus, model: req.body?.model || 'unknown', cache: 'MISS', team: apiKey?.teamName || 'unknown' });
      return res.status(401).json({ error: "Invalid or inactive API key." });
    }

    const rateLimit = await checkRateLimit(apiKey.teamName, apiKey.rateLimit, apiKey.rateLimitWindow);
    res.setHeader('X-RateLimit-Limit', rateLimit.limit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    
    if (!rateLimit.allowed) {
      finalStatus = 429;
      logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: finalStatus, model: req.body?.model || 'unknown', cache: 'MISS', team: apiKey.teamName });
      return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
    }

    const body = req.body;
    let model = body.model;

    if (!model) {
      finalStatus = 400;
      logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: finalStatus, model: 'unknown', cache: 'MISS', team: apiKey.teamName });
      return res.status(400).json({ error: "You forgot to specify a model in the JSON body!" });
    }

    const fallbacks: string[] = body.fallbacks || [];
    if (fallbacks.length === 0) {
      if (model === 'gpt-4o') fallbacks.push('claude-3-opus-20240229');
    }
    const modelsToTry = [model, ...fallbacks];

    const messages = body.messages || [];
    const latestMessage = messages[messages.length - 1]?.content;
    let embedding: number[] | null = null;
    let isStream = body.stream === true;

    // Semantic Cache Check
    if (latestMessage) {
      embedding = await getEmbedding(latestMessage);
      if (embedding) {
        for (const m of modelsToTry) {
          const cachedResponse = await findSimilarCache(embedding, m);
          if (cachedResponse) {
            res.setHeader('x-cache', 'HIT');
            
            logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: 200, model: m, cache: 'HIT', team: apiKey.teamName, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 });
            
            if (isStream) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
              
              const content = cachedResponse.choices[0].message.content;
              const chunks = content.split(' ');
              let i = 0;
              const interval = setInterval(() => {
                if (i >= chunks.length) {
                  res.write(`data: [DONE]\n\n`);
                  res.end();
                  clearInterval(interval);
                  return;
                }
                const chunkData = {
                  id: "cache-" + Date.now(),
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: m,
                  choices: [{ delta: { content: chunks[i] + (i < chunks.length - 1 ? ' ' : '') }, index: 0, finish_reason: null }]
                };
                res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
                i++;
              }, 20); // stream words from cache
              return;
            } else {
              return res.json(cachedResponse);
            }
          }
        }
      }
    }

    let resultResponse: Response | null = null;
    let lastError = null;

    for (const m of modelsToTry) {
      try {
        console.log(`[Failover] Attempting model: ${m}`);
        resultResponse = await callProvider(m, body);
        model = m;
        break;
      } catch (e: any) {
        console.error(`[Failover] Model ${m} failed:`, e.message);
        lastError = e;
      }
    }

    if (!resultResponse) {
      finalStatus = 502;
      logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: finalStatus, model: model, cache: 'MISS', team: apiKey.teamName });
      return res.status(502).json({ error: `All models failed. Last error: ${lastError?.message}` });
    }

    res.setHeader('x-cache', 'MISS');

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = resultResponse.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder("utf-8");
      
      let fullContent = "";
      let promptTokens = 0;
      let completionTokens = 0;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          res.write(chunkStr);
          
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices?.[0]?.delta?.content) {
                  fullContent += data.choices[0].delta.content;
                }
                if (data.usage) {
                  promptTokens = data.usage.prompt_tokens || 0;
                  completionTokens = data.usage.completion_tokens || 0;
                }
              } catch(e) {}
            }
          }
        }
      } finally {
        res.end();
        const totalTokens = promptTokens + completionTokens;
        const cost = calculateCost(model, promptTokens, completionTokens);
        
        logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: 200, model: model, cache: 'MISS', team: apiKey.teamName, promptTokens, completionTokens, totalTokens, cost });
        
        if (latestMessage && embedding && fullContent.trim().length > 0) {
           const fakeResult = {
             id: "cached-" + Date.now(),
             object: "chat.completion",
             created: Math.floor(Date.now() / 1000),
             model: model,
             choices: [{ index: 0, message: { role: "assistant", content: fullContent }, finish_reason: "stop" }]
           };
           saveToCache(latestMessage, embedding, model, fakeResult).catch(e => console.error("Background cache save error", e));
        }
      }
    } else {
      let data: any;
      
      if (model.startsWith('claude')) {
         const claudeData = await resultResponse.json();
         data = {
            id: claudeData.id,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            usage: {
              prompt_tokens: claudeData.usage?.input_tokens || 0,
              completion_tokens: claudeData.usage?.output_tokens || 0,
              total_tokens: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
            },
            choices: [{ index: 0, message: { role: "assistant", content: claudeData.content?.[0]?.text || "" }, finish_reason: "stop" }]
         };
      } else if (model.startsWith('gemini')) {
         const geminiData = await resultResponse.json();
         let content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Error";
         data = {
            id: "gemini-" + Date.now(),
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            usage: {
               prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
               completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
               total_tokens: geminiData.usageMetadata?.totalTokenCount || 0
            },
            choices: [{ index: 0, message: { role: "assistant", content: content }, finish_reason: "stop" }]
         };
      } else {
         data = await resultResponse.json();
      }

      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || 0;
      const cost = calculateCost(model, promptTokens, completionTokens);

      logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: 200, model: model, cache: 'MISS', team: apiKey.teamName, promptTokens, completionTokens, totalTokens, cost });
      
      if (latestMessage && embedding && data) {
         saveToCache(latestMessage, embedding, model, data).catch(e => console.error("Background cache save error", e));
      }
      
      res.json(data);
    }

  } catch (error) {
    console.error("Oops, something went wrong:", error);
    logRequest({ time: Date.now(), latency: Math.round(performance.now() - requestStartTime), status: 500, model: 'unknown', cache: 'MISS', team: 'unknown' });
    res.status(500).json({ error: "Something broke on the server!" });
  }
});


// Admin API: Analytics Endpoint
app.get('/v1/admin/analytics', async (req, res) => {
  const logs = await prisma.requestLog.findMany({
    orderBy: { timestamp: 'asc' }
  });
  
  let actualCost = 0;
  let totalRequests = logs.length;
  let cacheHits = 0;
  let totalTokens = 0;
  
  const teamUsage: Record<string, number> = {};
  
  logs.forEach(log => {
    actualCost += log.cost;
    totalTokens += log.totalTokens;
    if (log.cacheHit) cacheHits++;
    
    if (!teamUsage[log.teamName]) teamUsage[log.teamName] = 0;
    teamUsage[log.teamName] += log.totalTokens;
  });
  
  const nonCacheLogs = logs.filter(l => !l.cacheHit);
  const avgCostPerRequest = nonCacheLogs.length > 0 ? actualCost / nonCacheLogs.length : 0.002;
  const costSaved = cacheHits * avgCostPerRequest;
  
  const usageByDay: Record<string, number> = {};
  logs.forEach(log => {
    const day = log.timestamp.toISOString().split('T')[0];
    if (!usageByDay[day]) usageByDay[day] = 0;
    usageByDay[day] += log.totalTokens;
  });
  
  res.json({
    actualCost,
    costSaved,
    totalRequests,
    cacheHits,
    totalTokens,
    teamUsage,
    usageByDay
  });
});

app.get('/v1/admin/metrics', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    totalRequests: totalRequestsProcessed,
    memoryUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
    status: 'operational'
  });
});

app.get('/v1/admin/keys', async (req, res) => {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(keys);
});

app.post('/v1/admin/keys', async (req, res) => {
  const { teamName, rateLimit, rateLimitWindow } = req.body;
  if (!teamName) return res.status(400).json({ error: "teamName required" });
  
  const keyString = "og-" + crypto.randomBytes(16).toString('hex');
  const newKey = await prisma.apiKey.create({
    data: { 
      key: keyString, 
      teamName,
      ...(rateLimit && { rateLimit: parseInt(rateLimit, 10) }),
      ...(rateLimitWindow && { rateLimitWindow: parseInt(rateLimitWindow, 10) })
    }
  });
  res.json(newKey);
});

app.get('/v1/admin/logs', async (req, res) => {
  const logs = await prisma.requestLog.findMany({ 
    orderBy: { timestamp: 'desc' },
    take: 100
  });
  res.json(logs);
});

app.delete('/v1/admin/keys/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.apiKey.delete({ where: { id } });
  res.json({ success: true });
});

httpServer.listen(port, async () => {
  await connectRedis();
  console.log(`Server is running at http://localhost:${port}`);
});
