import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db';
import { missions } from '../server/schema';
import { desc } from 'drizzle-orm';

// Mock Data for Fallback
const MEMORY_MISSIONS = [
    {
        id: 1,
        name: "Artemis III (Simulated)",
        status: "Active",
        progress: 45,
        launchDate: "2025-09-15T00:00:00.000Z",
        arrivalDate: "2025-09-18T00:00:00.000Z",
        threatLevel: "Low",
        description: "Crewed lunar landing mission (Simulated Mode)"
    },
    {
        id: 2,
        name: "Mars Sample Return (Simulated)",
        status: "Planning",
        progress: 15,
        launchDate: "2028-06-20T00:00:00.000Z",
        arrivalDate: "2029-02-15T00:00:00.000Z",
        threatLevel: "Medium",
        description: "Robotic return of geological samples (Simulated Mode)"
    }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    console.log("[Missions API] Received request");

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    try {
        if (!db) {
            console.warn("[Missions] DB unavailable. Serving Mock Data.");
            return res.status(200).json(MEMORY_MISSIONS);
        }

        // DB Race with Timeout
        const dbPromise = db.select().from(missions).orderBy(desc(missions.launchDate));
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 3000));

        const allMissions = await Promise.race([dbPromise, timeoutPromise]);
        return res.status(200).json(allMissions);

    } catch (error) {
        console.warn("[Missions] DB Fetch failed. Fallback to Mock Data.");
        // Fail safe to memory data
        return res.status(200).json(MEMORY_MISSIONS);
    }
}
