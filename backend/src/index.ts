/**
 * Application Entry Point
 * 
 * Initializes:
 * 1. Database connection
 * 2. Model associations
 * 3. Express server
 * 4. Background jobs
 */

import dotenv from 'dotenv';
import createApp from './app.js';
import sequelize from './config/database.js';
import { initializeAssociations } from './models/associations.js';
import { startJobs } from './jobs/index.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the application
 */
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Initialize model associations
    initializeAssociations();
    console.log('✅ Model associations initialized');

    // Sync models in development (use migrations in production)
    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');
    }

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });

    // Start background jobs
    if (NODE_ENV === 'production') {
      startJobs();
      console.log('✅ Background jobs started');
    } else {
      console.log('⚠️  Background jobs disabled in development mode');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  console.log('✅ Database connection closed');
  process.exit(0);
});

// Start the server
startServer();

