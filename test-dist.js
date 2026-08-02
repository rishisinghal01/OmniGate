import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: './gateway/.env' });

async function getEmb(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text }] }
      })
    });
    const data = await res.json();
    return data.embedding.values;
}

function cosineSimilarity(A, B) {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for(let i = 0; i < A.length; i++) {
        dotproduct += (A[i] * B[i]);
        mA += (A[i] * A[i]);
        mB += (B[i] * B[i]);
    }
    return dotproduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

async function test() {
    const v1 = await getEmb("tell me somethibng abt u");
    const v2 = await getEmb("hey how are you can i knw something abt u");
    const sim = cosineSimilarity(v1, v2);
    const dist = 1 - sim; // In redis KNN cosine distance is usually 1 - similarity
    console.log("Cosine Similarity:", sim);
    console.log("Cosine Distance:", dist);
}

test();
