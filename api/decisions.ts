import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { decisions } from '../server/schema';
import { desc } from 'drizzle-orm';

// Enhanced Mock Data for AI Context (Matches server/routes.ts)
const ENRICHED_MEMORY_DECISIONS = [
    {
        id: 1,
        timestamp: new Date().toISOString(),
        threatDetected: "Solar Flare X9.3 (Class X)",
        originalTrajectory: "Direct Hohmann Transfer",
        selectedTrajectory: "L1 Lagrange Point Holding Pattern",
        reasoning: "Detected X-Class solar flare event aligned with translunar injection window. Direct transfer would exceed crew radiation limits (>500 mSv). Holding at Earth-Sun L1 allows spacecraft hull to orient protective shielding towards the active region while waiting for particle flux to subside.",
        tradeOffs: { "fuelCost": "+12%", "travelTime": "+18 hours", "radiationReduction": "-94%", "missionSuccessProb": "+45%" },
        status: "EXECUTING",
        confidence: 99.8
    },
    {
        id: 2,
        originalTrajectory: "Standard LEO departure",
        selectedTrajectory: "Modified inclination change",
        reasoning: "Debris collision probability exceeded 1:1000 threshold. Implemented 2.3° inclination adjustment.",
        tradeOffs: { "fuelCost": "+3%", "travelTime": "+45 minutes", "collisionRisk": "-85%", "safetyScore": "+30%" },
        status: "Completed",
        confidence: 98
    }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const db = drizzle(pool);

    try {
        const result = await db.select().from(decisions).orderBy(desc(decisions.timestamp)).limit(10);
        await pool.end();
        return res.status(200).json(result);
    } catch (error) {
        console.warn("[Decisions API] Serving Enhanced Memory Data due to DB error:", error);
        return res.status(200).json(ENRICHED_MEMORY_DECISIONS);
    }
}
