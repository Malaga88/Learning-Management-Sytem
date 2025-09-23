import express from 'express';
import { verifyToken, authorize } from '../middleware/auth.mjs';
import { getAnalytics } from '../middleware/analytics.mjs';
import { clearCache } from '../middleware/cache.mjs';

const utilityRouter = express.Router();

// Admin-only analytics endpoint
utilityRouter.get('/analytics',
    verifyToken,
    authorize('admin'),
    (req, res) => {
        const data = getAnalytics();
        res.json({
            success: true,
            message: 'Analytics data retrieved',
            data
        });
    }
);

// Admin-only cache management
utilityRouter.delete('/cache/:pattern?',
    verifyToken,
    authorize('admin'),
    (req, res) => {
        const pattern = req.params.pattern || '';
        clearCache(pattern);
        res.json({
            success: true,
            message: `Cache cleared for pattern: ${pattern || 'all'}`
        });
    }
);

// System status
utilityRouter.get('/status',
    verifyToken,
    authorize('admin'),
    async (req, res) => {
        try {
            // Check database connection
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            
            // Get memory usage
            const memoryUsage = process.memoryUsage();
            
            // Get uptime
            const uptime = process.uptime();
            
            res.json({
                success: true,
                data: {
                    database: dbStatus,
                    uptime: Math.floor(uptime / 60) + ' minutes',
                    memory: {
                        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
                    },
                    nodejs: process.version,
                    platform: process.platform,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching system status',
                error: error.message
            });
        }
    }
);

export default utilityRouter;