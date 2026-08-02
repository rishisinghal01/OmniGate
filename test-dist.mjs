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
    const v2 = await getEmb("hey how are you can i knw something abt u\" bhejeinge");
    const v3 = await getEmb("hey how are you can i knw something abt u");
    
    console.log("Similarity (with bhejeinge):", cosineSimilarity(v1, v2));
    console.log("Distance (with bhejeinge):", 1 - cosineSimilarity(v1, v2));
    
    console.log("Similarity (without bhejeinge):", cosineSimilarity(v1, v3));
    console.log("Distance (without bhejeinge):", 1 - cosineSimilarity(v1, v3));
}

test();
