import { redisClient } from './cache.js';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
}

export async function checkRateLimit(teamName: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const key = `ratelimit:${teamName}`;
  
  try {
    // Increment the count for this team
    const currentCount = await redisClient.incr(key);
    
    // If it's a new window, set the expiration
    if (currentCount === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    
    const allowed = currentCount <= limit;
    const remaining = Math.max(0, limit - currentCount);
    
    return {
      allowed,
      limit,
      remaining
    };
  } catch (error) {
    console.error("Rate limit check failed, allowing request by default:", error);
    return { allowed: true, limit, remaining: limit - 1 };
  }
}
