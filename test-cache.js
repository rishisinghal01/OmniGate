import { getEmbedding, findSimilarCache, saveToCache, connectRedis, redisClient } from './gateway/src/cache.js';
import dotenv from 'dotenv';
dotenv.config({ path: './gateway/.env' });

async function run() {
  await connectRedis();
  const text1 = "tell me somethibng abt u";
  const text2 = "hey how are you can i knw something abt u";
  
  console.log("Getting embedding 1...");
  const e1 = await getEmbedding(text1);
  if (!e1) return console.log("E1 failed");
  console.log("Saving 1...");
  await saveToCache(text1, e1, { response: "ok" });
  
  // wait 1 sec
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Getting embedding 2...");
  const e2 = await getEmbedding(text2);
  
  console.log("Finding similar...");
  await findSimilarCache(e2);
  
  redisClient.disconnect();
}
run();
