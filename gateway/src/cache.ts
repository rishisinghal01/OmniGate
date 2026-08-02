import { createClient, SCHEMA_FIELD_TYPE, SCHEMA_VECTOR_FIELD_ALGORITHM } from 'redis';

// Configure Redis Client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;
let indexCreated = false;

const INDEX_NAME = 'idx:semantic_cache_gemini';
const PREFIX = 'cache_gemini:';

export async function connectRedis() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
    console.log("Connected to Redis");
    await createVectorIndex();
  }
}

// Create RediSearch Vector Index
async function createVectorIndex() {
  if (indexCreated) return;
  
  try {
    // Check if index exists
    await redisClient.ft.info(INDEX_NAME);
    indexCreated = true;
    console.log("Redis vector index already exists.");
  } catch (e: any) {
    if (e.message.toLowerCase().includes('unknown index name')) {
      console.log("Creating Redis vector index...");
      // Gemini gemini-embedding-2 uses 768 dimensions
      try {
        await redisClient.ft.create(
          INDEX_NAME,
          {
            prompt: {
              type: SCHEMA_FIELD_TYPE.TEXT,
              AS: 'prompt',
              WEIGHT: 1
            },
            embedding: {
              type: SCHEMA_FIELD_TYPE.VECTOR,
              ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
              TYPE: 'FLOAT32',
              DIM: 768,
              DISTANCE_METRIC: 'COSINE'
            }
          },
          {
            ON: 'HASH',
            PREFIX: PREFIX
          }
        );
        indexCreated = true;
        console.log("Redis vector index created successfully.");
      } catch (createErr) {
        console.error("Error creating vector index:", createErr);
      }
    } else {
      console.error("Error checking vector index:", e);
    }
  }
}

// Generate Embeddings using Gemini
export async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("GEMINI_API_KEY not found. Semantic caching is disabled.");
      return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: {
          parts: [{ text: text }]
        }
      })
    });

    if (!res.ok) {
      console.error("Failed to generate embedding:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.embedding.values;
  } catch (e) {
    console.error("Error generating embedding:", e);
    return null;
  }
}

// Convert number array to Float32Array buffer for Redis
function float32Buffer(arr: number[]) {
  return Buffer.from(new Float32Array(arr).buffer);
}

// Search for similar cache entries
export async function findSimilarCache(embedding: number[]): Promise<any | null> {
  if (!isConnected) return null;
  
  try {
    const embeddingBuffer = float32Buffer(embedding);
    
    // We want distance < 0.30
    const results = await redisClient.ft.search(
      INDEX_NAME,
      `*=>[KNN 1 @embedding $BLOB AS dist]`,
      {
        PARAMS: {
          BLOB: embeddingBuffer
        },
        RETURN: ['prompt', 'response', 'dist'],
        SORTBY: 'dist',
        DIALECT: 2,
        LIMIT: { from: 0, size: 1 }
      }
    );

    if (results.total === 0) return null;

    const document = results.documents[0];
    if (!document) return null;
    const dist = parseFloat(document.value.dist as string);
    
    if (dist < 0.30) {
      console.log(`Cache HIT! Distance: ${dist.toFixed(4)}`);
      return JSON.parse(document.value.response as string);
    }
    
    console.log(`Cache MISS! Best match distance: ${dist.toFixed(4)}`);
    return null;

  } catch (e) {
    console.error("Error searching cache:", e);
    return null;
  }
}

// Save a new response to cache
export async function saveToCache(prompt: string, embedding: number[], response: any) {
  if (!isConnected) return;
  
  try {
    const id = `${PREFIX}${Date.now()}`;
    const embeddingBuffer = float32Buffer(embedding);

    await redisClient.hSet(id, {
      prompt: prompt,
      embedding: embeddingBuffer as any, // type casting for node-redis
      response: JSON.stringify(response)
    });
    
    // Optional: Set expiration (e.g., 24 hours)
    await redisClient.expire(id, 60 * 60 * 24);
    console.log(`Saved to semantic cache: ${id}`);
  } catch (e) {
    console.error("Error saving to cache:", e);
  }
}
