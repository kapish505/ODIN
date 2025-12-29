import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes (which include /api prefixes)
registerRoutes(app);

// Export for Vercel
export default app;
