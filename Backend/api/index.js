import { createApp } from '../src/app.js';
import { connectAllDatabases } from '../src/config/database.js';

// Initialize the app
const app = createApp();

/**
 * Vercel Serverless Function Entry Point
 * Ensures database connections are established before handling the request.
 * Vercel reuses this function instance, so connections should be cached by the singletons in database.js
 */
export default async function handler(req, res) {
    try {
        // Ensure DB is connected
        await connectAllDatabases();
    } catch (error) {
        console.error('Database connection failed during serverless function execution:', error);
        // Fallback: Express handles the error via its own middleware if possible, 
        // but if DB is down, we might want to return 500 here explicitly if app usage fails.
        // However, we'll let Express try or failing that, this log helps.
    }

    // Delegate to Express
    return app(req, res);
}
