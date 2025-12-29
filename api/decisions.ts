import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Data
const MEMORY_DECISIONS = [
    {
        id: 1,
        timestamp: "2024-03-15T14:30:00Z",
        threatDetected: "Solar flare (X9.3 class)",
        originalTrajectory: "Direct Hohmann transfer",
        selectedTrajectory: "L1 Lagrange point route",
        reasoning: "Rerouting via L1 Lagrange point reduces radiation exposure by 90% with only 6-hour delay.",
        tradeOffs: { "fuelCost": "+12%", "travelTime": "+6 hours", "radiationReduction": "-90%", "safetyScore": "+45%" },
        status: "Implemented",
        confidence: 94
    },
    {
        id: 2,
        timestamp: "2024-03-14T09:15:00Z",
        threatDetected: "Space debris field (>10cm objects)",
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
    return res.status(200).json(MEMORY_DECISIONS);
}
