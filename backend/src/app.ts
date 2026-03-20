import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import 'express-async-errors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { PROFILE_DIR, ATTACHMENTS_DIR } from './middlewares/upload.middleware.js';

/**
 * Create and configure Express application
 * 
 * Security middlewares:
 * - helmet: Sets secure HTTP headers
 * - cors: Configures cross-origin resource sharing
 * 
 * API versioning: /api/v1/
 * Swagger docs: /api-docs
 */
const createApp = (): Application => {
  const app = express();

  // Security middlewares
  app.use(helmet());

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const isLocalhostOrigin = (origin: string): boolean => {
    try {
      const url = new URL(origin);
      return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch {
      return false;
    }
  };

  const isPrivateNetworkOrigin = (origin: string): boolean => {
    try {
      const url = new URL(origin);
      const host = url.hostname;
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
      const match172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
      if (match172) {
        const secondOctet = Number(match172[1]);
        return secondOctet >= 16 && secondOctet <= 31;
      }
      return false;
    } catch {
      return false;
    }
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server or curl)
        if (!origin) {
          return callback(null, true);
        }

        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          isLocalhostOrigin(origin) ||
          (isDevelopment && isPrivateNetworkOrigin(origin))
        ) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure upload directories exist
  [PROFILE_DIR, ATTACHMENTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.resolve('uploads')));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
    });
  });

  // API documentation (Swagger)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API routes (versioned)
  app.use('/api/v1', routes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        statusCode: 404,
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;

