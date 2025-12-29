import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Hardcoded 5s timeout to prevent Vercel 10s default killing it silently
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";

        // Allow CORS for local dev or any origin (MVP)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const { startDate, endDate } = req.query;

        // Default to last 30 days if no date provided
        let dateStr = "";
        if (startDate) {
            dateStr = startDate as string;
        } else {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            dateStr = d.toISOString().split('T')[0];
        }

        const endDateParam = endDate ? `&endDate=${endDate}` : "";
        const apiUrl = `https://api.nasa.gov/DONKI/notifications?startDate=${dateStr}${endDateParam}&type=all&api_key=${apiKey}`;

        console.log(`[Weather] Fetching JSON...`);

        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            const txt = await response.text();
            console.error(`[Weather] Upstream Error ${response.status}: ${txt.slice(0, 100)}`);
            // Return 200 with empty array fallback or specific error JSON, but don't crash 500
            return res.status(response.status).json({ error: "NASA API Error", details: txt });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error: any) {
        clearTimeout(timeout);
        console.error("[Weather] Critical Failure:", error);

        if (error.name === 'AbortError') {
            return res.status(504).json({ error: "Gateway Timeout (NASA API)" });
        }

        // Always return JSON, never let the runtime catch an uncaught exception
        return res.status(500).json({ error: "Internal Server Logic Error", msg: error.message });
    }
}
