import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { processScanRequest } from '../lib/scanService';
import { PlaywrightBrowserService } from '../lib/ai/playwright/browserService';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// CORS configuration supporting single domain, multiple domains, or wildcard
const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, health checkers)
    if (!origin) return callback(null, true);
    // Default wildcard or explicit wildcard
    if (!corsOriginEnv || corsOriginEnv.trim() === '*' || corsOriginEnv.trim() === '') {
      return callback(null, true);
    }

    const allowedOrigins = corsOriginEnv
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''));
    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root informational endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'HorizonScan Backend Service',
    status: 'healthy',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      scan: 'POST /api/scan',
    },
    timestamp: new Date().toISOString(),
  });
});

// Render health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'horizonscan-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Primary market scan endpoint
app.post('/api/scan', async (req: Request, res: Response) => {
  try {
    const result = await processScanRequest(req.body);
    res.status(result.status).json(result.data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Server] Scan API Error:', errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});

// Start HTTP server on 0.0.0.0 for containerized Render host compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[HorizonScan] Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`[HorizonScan] Health check endpoint: http://localhost:${PORT}/health`);
  console.log(`[HorizonScan] Scan endpoint: http://localhost:${PORT}/api/scan`);
  console.log(`[HorizonScan] Configured CORS Origin: ${corsOriginEnv || '*'}`);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`[HorizonScan] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await PlaywrightBrowserService.getInstance().close();
    } catch {
      // ignore
    }
    console.log('[HorizonScan] HTTP server and browser instances closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
