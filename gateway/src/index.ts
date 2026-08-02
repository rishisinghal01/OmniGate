import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectRedis, getEmbedding, findSimilarCache, saveToCache } from './cache.js';
// Load variables from .env file
dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Root endpoint for browser checks
app.get('/', (req, res) => {
  res.send('OmniGate API is running! 🚀 Send a POST request to /v1/chat/completions to interact.');
});

// Helper function for Mock (Free testing without keys!)
async function callMock(body: any) {
  console.log("Routing to Mock...");
  
  return {
    id: "mock-" + Date.now(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: body.model,
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
  };
}

// Helper function to call OpenAI
async function callOpenAI(body: any) {
  const openaiKey = process.env.OPENAI_API_KEY;
  console.log("Routing to OpenAI...");
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify(body)
  });
  return await response.json();
}

// Helper function to call Claude (Anthropic)
async function callClaude(body: any) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  console.log("Routing to Claude...");

  // 1. Anthropic wants the system prompt separate from the messages
  let systemPrompt = "";
  const filteredMessages = body.messages.filter((m: any) => {
    if (m.role === 'system') {
      systemPrompt = m.content;
      return false;
    }
    return true;
  });

  // 2. Make the request to Anthropic
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
      messages: filteredMessages
    })
  });

  const claudeData = await response.json();

  // 3. Translate Claude's response to look exactly like OpenAI's!
  // This tricks the frontend into thinking it's always talking to OpenAI
  return {
    id: claudeData.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: body.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: claudeData.content?.[0]?.text || "Error getting response"
        },
        finish_reason: "stop"
      }
    ]
  };
}

// Helper function to call Google Gemini
async function callGemini(body: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log("Routing to Gemini...");

  // 1. Translate OpenAI messages to Gemini format
  const geminiContents = body.messages.map((m: any) => {
    return {
      // Gemini uses "user" and "model", OpenAI uses "user" and "assistant"
      role: m.role === 'assistant' ? 'model' : 'user', 
      parts: [{ text: m.content }]
    };
  });

  // 2. Make the request to Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent?key=${geminiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: geminiContents
    })
  });

  const geminiData = await response.json();
  
  // Log the raw response so we can see what went wrong in the terminal
  console.log("Gemini API Response:", JSON.stringify(geminiData, null, 2));

  let content = "Error getting response";
  if (geminiData.error) {
    content = `API Error: ${geminiData.error.message}`;
  } else if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
    content = geminiData.candidates[0].content.parts[0].text;
  }

  // 3. Translate Gemini's response to look exactly like OpenAI's
  return {
    id: "gemini-" + Date.now(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: body.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: content
        },
        finish_reason: "stop"
      }
    ]
  };
}

// Helper function to call OpenRouter
async function callOpenRouter(body: any) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  console.log("Routing to OpenRouter...");
  
  // OpenRouter uses the exact same format as OpenAI!
  // We just need to change the URL and the API key header.
  
  // Optional: OpenRouter asks to remove the 'openrouter/' prefix from the model name 
  // before sending the request, or we can just send it as is if OpenRouter expects it.
  // Actually, OpenRouter expects the model name like 'google/gemini-2.5-flash', 
  // so if the user passes 'openrouter/google/gemini-2.5-flash', we strip 'openrouter/'.
  let targetModel = body.model;
  if (targetModel.startsWith('openrouter/')) {
    targetModel = targetModel.replace('openrouter/', '');
  }
  
  const payload = { ...body, model: targetModel };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`,
      'HTTP-Referer': 'http://localhost:3000', // OpenRouter requires these headers for rankings
      'X-Title': 'OmniGate'
    },
    body: JSON.stringify(payload)
  });
  
  const openRouterData = await response.json();
  
  // Log if there is an error
  if (openRouterData.error) {
    console.log("OpenRouter API Error:", JSON.stringify(openRouterData, null, 2));
    return {
      id: "openrouter-error",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `OpenRouter API Error: ${openRouterData.error.message || 'Unknown error'}`
          },
          finish_reason: "stop"
        }
      ]
    };
  }
  
  return openRouterData;
}

// Our main endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No API key provided!" });
    }

    const token = authHeader.split(' ')[1];
    if (token !== 'test-key-123') {
      return res.status(401).json({ error: "Wrong API key. Try 'test-key-123'." });
    }

    const body = req.body;
    const model = body.model;

    if (!model) {
      return res.status(400).json({ error: "You forgot to specify a model in the JSON body!" });
    }

    // 1. Extract the user's latest message for caching
    const messages = body.messages || [];
    const latestMessage = messages[messages.length - 1]?.content;
    let embedding: number[] | null = null;

    // 2. Check Semantic Cache
    if (latestMessage) {
      embedding = await getEmbedding(latestMessage);
      if (embedding) {
        const cachedResponse = await findSimilarCache(embedding);
        if (cachedResponse) {
          res.setHeader('x-cache', 'HIT');
          return res.json(cachedResponse);
        }
      }
    }

    let result;

    // Decide which provider to use based on the model name!
    if (model.startsWith('gpt')) {
      result = await callOpenAI(body);
    } 
    else if (model.startsWith('claude')) {
      result = await callClaude(body);
    } 
    else if (model.startsWith('gemini')) {
      result = await callGemini(body);
    } 
    else if (model.startsWith('mock')) {
      result = await callMock(body);
    }
    else if (model.startsWith('openrouter/')) {
      result = await callOpenRouter(body);
    }
    else {
      return res.status(400).json({ error: "Unknown model. Try mock-test, openrouter/..., gpt-4, claude-3, or gemini-2.0-flash." });
    }

    // Send the result back to the user
    res.setHeader('x-cache', 'MISS');
    res.json(result);

    // Save to Cache in background
    if (latestMessage && embedding && result) {
      // Don't await this, let it run in background
      saveToCache(latestMessage, embedding, result).catch(e => console.error("Background cache save error", e));
    }

  } catch (error) {
    console.error("Oops, something went wrong:", error);
    res.status(500).json({ error: "Something broke on the server!" });
  }
});

app.listen(port, async () => {
  await connectRedis();
  console.log(`Server is running at http://localhost:${port}`);
});
