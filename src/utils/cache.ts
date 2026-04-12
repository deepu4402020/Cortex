// Simulated Redis In-Memory Cache Layer
// In a true production environment, this would be `import { createClient } from "redis"`
// But for this project, we implement an LRU Map to demonstrate Read-Through caching architecture.

class CacheLayer {
  private cache = new Map<string, { value: any; expiry: number }>();

  // Set theoretical time-to-live (5 minutes)
  public set(key: string, value: any, ttlInSeconds = 300) {
    const expiry = Date.now() + ttlInSeconds * 1000;
    this.cache.set(key, { value, expiry });
    // In strict LRU, we would evict oldest here if size exceeded max capacity
  }

  public get(key: string): any | null {
    const data = this.cache.get(key);
    if (!data) return null;

    if (Date.now() > data.expiry) {
      this.cache.delete(key);
      return null;
    }

    return data.value;
  }

  public invalidate(keyPrefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const redisCache = new CacheLayer();
