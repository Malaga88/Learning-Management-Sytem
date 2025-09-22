export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous',
            timestamp: new Date().toISOString()
        };
        
        // Log to console (in production, use proper logging service)
        console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.status} - ${logData.duration} - ${logData.ip} - ${logData.userId}`);
    });
    
    next();
};