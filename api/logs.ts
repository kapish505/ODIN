import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Minimal placeholder for logs to prevent 404s
    return res.status(200).json([
        { id: 0, type: "INFO", message: "System Initialized (Serverless)", timestamp: new Date().toISOString() }
    ]);
}
