import NodeCache from 'node-cache';

// Create cache instance
const cache = new NodeCache({ 
    stdTTL: 600, // 10 minutes default
    checkperiod: 120 // Check for expired keys every 2 minutes
});

// Cache middleware
export const cacheMiddleware = (duration = 600) => {
    return (req, res, next) => {
        // Skip cache for authenticated requests or non-GET requests
        if (req.method !== 'GET' || req.user) {
            return next();
        }
        
        const key = req.originalUrl || req.url;
        const cachedResponse = cache.get(key);
        
        if (cachedResponse) {
            console.log(`📦 Cache hit for ${key}`);
            return res.json(cachedResponse);
        }
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache response
        res.json = function(data) {
            // Only cache successful responses
            if (data.success !== false) {
                cache.set(key, data, duration);
                console.log(`💾 Cached response for ${key}`);
            }
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Clear cache for specific patterns
export const clearCache = (pattern) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => cache.del(key));
    console.log(`🗑️ Cleared ${matchingKeys.length} cache entries for pattern: ${pattern}`);
};