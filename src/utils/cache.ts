import Redis from "ioredis";

// Use REDIS_URL from env or fallback to localhost for development
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisClient.on("error", (err) => {
  console.error("[Redis Error]:", err);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected successfully.");
});

class CacheLayer {
  // Read-Through Cache Strategy:
  // 1. Application asks CacheLayer for data.
  // 2. If Cache Miss, CacheLayer returns null. Application fetches from DB.
  // 3. Application then calls CacheLayer.set to store the DB result.
  // Graceful Fallback: If Redis is down, we catch the error, log it, and return null.
  // The application treats this as a normal cache miss and reads from the database.
  public async get(key: string): Promise<any | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      console.warn(`[Cache Error] Failed to get key ${key}, falling back to DB:`, err);
      return null; // Graceful degradation
    }
  }

  // Set with TTL (default 300s / 5 mins)
  public async set(key: string, value: any, ttlInSeconds = 300): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlInSeconds);
    } catch (err) {
      console.warn(`[Cache Error] Failed to set key ${key}:`, err);
      // Fail gracefully, cache set failure shouldn't crash the app
    }
  }

  // Write-Invalidate Cache Strategy:
  // When data is mutated (created, updated, deleted), we invalidate (delete) the related cache keys.
  // This ensures the next read operation results in a Cache Miss and fetches fresh data.
  public async invalidate(keyPrefix: string): Promise<void> {
    try {
      // Use keys cautiously. In a massive prod app, SCAN is preferred over KEYS to avoid blocking.
      const keys = await redisClient.keys(`${keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.warn(`[Cache Error] Failed to invalidate prefix ${keyPrefix}:`, err);
    }
  }
}

export const redisCache = new CacheLayer();
