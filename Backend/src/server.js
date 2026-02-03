/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Server Entry Point
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Application entry point - starts the HTTP server and connects to databases.
 * 
 * @module server
 */

import { createApp } from './app.js';
import env from './config/env.js';
import { connectAllDatabases, disconnectAllDatabases } from './config/database.js';
import logger from './utils/logger.js';

/**
 * Graceful shutdown handler
 * @param {import('http').Server} server - HTTP server instance
 */
function setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);

        // Stop accepting new connections
        server.close(async (err) => {
            if (err) {
                logger.error('Error during server close:', err);
                process.exit(1);
            }

            try {
                // Disconnect from databases
                await disconnectAllDatabases();

                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during cleanup:', error);
                process.exit(1);
            }
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
function setupErrorHandlers() {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

/**
 * Start the server
 */
async function startServer() {
    try {
        // Setup global error handlers
        setupErrorHandlers();

        // Connect to databases
        logger.info('Connecting to databases...');
        await connectAllDatabases();

        // Create Express app
        const app = createApp();

        // Start HTTP server
        const server = app.listen(env.PORT, () => {
            logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   🚀  NyayBooker API Server                                      ║
║                                                                  ║
║   Environment: ${env.NODE_ENV.padEnd(45)}║
║   Port: ${String(env.PORT).padEnd(55)}║
║   API Version: ${env.API_VERSION.padEnd(48)}║
║                                                                  ║
║   Health: http://localhost:${env.PORT}/health                        ║
║   API: http://localhost:${env.PORT}/api/${env.API_VERSION}                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
      `);
        });

        // Configure server
        server.keepAliveTimeout = 65000; // Slightly higher than ALB's 60 seconds
        server.headersTimeout = 66000;

        // Setup graceful shutdown
        setupGracefulShutdown(server);

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
