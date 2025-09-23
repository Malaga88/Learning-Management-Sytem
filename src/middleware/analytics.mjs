const analytics = {
    requests: 0,
    uniqueUsers: new Set(),
    endpoints: {},
    errors: 0
};

export const analyticsMiddleware = (req, res, next) => {
    analytics.requests++;
    
    if (req.user) {
        analytics.uniqueUsers.add(req.user.id);
    }
    
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    analytics.endpoints[endpoint] = (analytics.endpoints[endpoint] || 0) + 1;
    
    // Track errors
    const originalJson = res.json;
    res.json = function(data) {
        if (data.success === false) {
            analytics.errors++;
        }
        return originalJson.call(this, data);
    };
    
    next();
};

// Get analytics data
export const getAnalytics = () => {
    return {
        totalRequests: analytics.requests,
        uniqueUsers: analytics.uniqueUsers.size,
        topEndpoints: Object.entries(analytics.endpoints)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([endpoint, count]) => ({ endpoint, count })),
        errorCount: analytics.errors,
        errorRate: analytics.requests > 0 ? (analytics.errors / analytics.requests * 100).toFixed(2) + '%' : '0%'
    };
};