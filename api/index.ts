import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all API routes
// The original registerRoutes also returns an httpServer, but for Vercel we just need the express app
registerRoutes(app);

// Vercel expects the default export to be a function (req, res) -> void
// Express app instance is exactly that.
export default app;
