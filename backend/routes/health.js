const express = require('express');
const { healthCheck } = require('../config/database');
const { catchAsync } = require('../middleware/errorHandler');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Basic health check
router.get('/', catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database health
    const dbHealth = await healthCheck();
    
    // Check file system (uploads directory)
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    let uploadsWritable = false;
    try {
      await fs.access(uploadsDir, fs.constants.W_OK);
      uploadsWritable = true;
    } catch (error) {
      uploadsWritable = false;
    }
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      message: 'UAE Visa Services API is running smoothly',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        },
        fileSystem: {
          status: uploadsWritable ? 'healthy' : 'warning',
          uploadsWritable
        }
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          system: Math.round(os.totalmem() / 1024 / 1024) + ' MB'
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        }
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      message: 'Service is experiencing issues',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: {
        message: error.message,
        code: 'HEALTH_CHECK_FAILED'
      },
      services: {
        database: {
          status: 'unhealthy',
          error: error.message
        }
      }
    });
  }
}));

// Detailed health check with more metrics
router.get('/detailed', catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Database health
    const dbHealth = await healthCheck();
    
    // Check uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    let uploadsInfo = {};
    try {
      const stats = await fs.stat(uploadsDir);
      const files = await fs.readdir(uploadsDir);
      uploadsInfo = {
        exists: true,
        writable: true,
        fileCount: files.length,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      uploadsInfo = {
        exists: false,
        writable: false,
        error: error.message
      };
    }
    
    // Environment variables check (without exposing sensitive data)
    const envCheck = {
      PORT: !!process.env.PORT,
      NODE_ENV: !!process.env.NODE_ENV,
      DATABASE_PATH: !!process.env.DATABASE_PATH,
      CORS_ORIGIN: !!process.env.CORS_ORIGIN,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      JWT_SECRET: !!process.env.JWT_SECRET
    };
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      message: 'Detailed health check completed',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'healthy',
          type: 'SQLite',
          responseTime: `${responseTime}ms`
        },
        fileSystem: {
          status: uploadsInfo.writable ? 'healthy' : 'warning',
          uploads: uploadsInfo
        },
        email: {
          status: process.env.SMTP_HOST ? 'configured' : 'not configured',
          host: process.env.SMTP_HOST ? 'configured' : 'missing'
        }
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        hostname: os.hostname(),
        memory: {
          process: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
          },
          system: {
            total: Math.round(os.totalmem() / 1024 / 1024),
            free: Math.round(os.freemem() / 1024 / 1024),
            used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
          }
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown',
          loadAverage: os.loadavg(),
          usage: process.cpuUsage()
        }
      },
      configuration: {
        environment: envCheck,
        rateLimit: {
          windowMs: process.env.RATE_LIMIT_WINDOW_MS || '900000',
          maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '100'
        },
        upload: {
          maxSize: process.env.UPLOAD_MAX_SIZE || '5242880',
          allowedTypes: process.env.UPLOAD_ALLOWED_TYPES || 'default'
        }
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      message: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: {
        message: error.message,
        code: 'DETAILED_HEALTH_CHECK_FAILED'
      }
    });
  }
}));

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Helper function to format uptime
function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.join(' ') || '0s';
}

module.exports = router;