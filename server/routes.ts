import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "./db";
import { missions, logs, decisions } from "./schema";
import { desc, eq } from "drizzle-orm";
// node-fetch not required for Node 18+

export function registerRoutes(app: Express): Server {
    setupAuth(app);

    // --- In-Memory Fallback Data ---
    const memoryMissions = [
        {
            id: 1,
            name: "Artemis III",
            status: "Active",
            progress: 45,
            launchDate: "2025-09-15T00:00:00.000Z",
            arrivalDate: "2025-09-18T00:00:00.000Z",
            threatLevel: "Low",
            description: "Crewed lunar landing mission"
        },
        {
            id: 2,
            name: "Mars Sample Return",
            status: "Planning",
            progress: 15,
            launchDate: "2028-06-20T00:00:00.000Z",
            arrivalDate: "2029-02-15T00:00:00.000Z",
            threatLevel: "Medium",
            description: "Robotic return of geological samples"
        }
    ];

    const memoryDecisions = [
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

    // --- Missions API ---
    app.get("/api/missions", async (req, res) => {
        try {
            const allMissions = await db.select().from(missions).orderBy(desc(missions.launchDate));
            res.json(allMissions);
        } catch (error) {
            console.warn("DB fetch failed, serving memory missions.");
            res.json(memoryMissions);
        }
    });

    // --- Logs API ---
    app.get("/api/logs", async (req, res) => {
        try {
            const recentLogs = await db.select().from(logs).orderBy(desc(logs.timestamp)).limit(50);
            res.json(recentLogs);
        } catch (error) {
            res.json([]); // Return empty logs on DB failure
        }
    });

    app.post("/api/logs", async (req, res) => {
        try {
            const { type, message, meta } = req.body;
            const [newLog] = await db.insert(logs).values({
                type,
                message,
                meta: meta || {},
                timestamp: new Date()
            }).returning();
            res.json(newLog);
        } catch (error) {
            // Silently fail or send placeholder
            res.status(200).json({ id: 0, type: "INFO", message: "Log (Memory)", timestamp: new Date() });
        }
    });

    // --- AI Decisions API ---
    app.get("/api/ai/decisions", async (req, res) => {
        try {
            const allDecisions = await db.select().from(decisions).orderBy(desc(decisions.timestamp));
            res.json(allDecisions);
        } catch (error) {
            console.warn("DB fetch failed, serving memory decisions.");
            res.json(memoryDecisions);
        }
    });

    // --- Data Seeding (For Demo Purposes) ---
    // Check and seed missions
    (async () => {
        try {
            const existingMissions = await db.select().from(missions);
            if (existingMissions.length === 0) {
                console.log("Seeding missions...");
                await db.insert(missions).values([
                    {
                        name: "Artemis III",
                        status: "Active",
                        progress: 45,
                        launchDate: new Date("2025-09-15"),
                        arrivalDate: new Date("2025-09-18"),
                        threatLevel: "Low",
                        description: "Crewed lunar landing mission"
                    },
                    {
                        name: "Mars Sample Return",
                        status: "Planning",
                        progress: 15,
                        launchDate: new Date("2028-06-20"),
                        arrivalDate: new Date("2029-02-15"),
                        threatLevel: "Medium",
                        description: "Robotic return of geological samples"
                    }
                ]);
            }

            const existingDecisions = await db.select().from(decisions);
            if (existingDecisions.length === 0) {
                console.log("Seeding AI decisions...");
                await db.insert(decisions).values([
                    {
                        timestamp: new Date("2024-03-15T14:30:00Z"),
                        threatDetected: "Solar flare (X9.3 class)",
                        originalTrajectory: "Direct Hohmann transfer",
                        selectedTrajectory: "L1 Lagrange point route",
                        reasoning: "Rerouting via L1 Lagrange point reduces radiation exposure by 90% with only 6-hour delay.",
                        tradeOffs: {
                            fuelCost: "+12%",
                            travelTime: "+6 hours",
                            radiationReduction: "-90%",
                            safetyScore: "+45%"
                        },
                        status: "Implemented",
                        confidence: 94
                    },
                    {
                        timestamp: new Date("2024-03-14T09:15:00Z"),
                        threatDetected: "Space debris field (>10cm objects)",
                        originalTrajectory: "Standard LEO departure",
                        selectedTrajectory: "Modified inclination change",
                        reasoning: "Debris collision probability exceeded 1:1000 threshold. Implemented 2.3° inclination adjustment.",
                        tradeOffs: {
                            fuelCost: "+3%",
                            travelTime: "+45 minutes",
                            collisionRisk: "-85%",
                            safetyScore: "+30%"
                        },
                        status: "Completed",
                        confidence: 98
                    }
                ]);
            }
        } catch (error) {
            console.warn("Skipping DB seeding (DB unavailable).");
        }
    })();

    // --- NASA Space Weather API (DONKI) ---
    // --- NASA DONKI Proxy ---
    app.get("/api/weather/notifications", async (req, res) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

        try {
            // Use DEMO_KEY for prototype, or ENV variable if available
            const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
            console.log(`[Proxy] Using API Key: ${apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : '***' + apiKey.slice(-4)}`);

            // Get dates from query or default to last 30 days
            let dateStr = "";
            let endDateStr = "";

            if (req.query.startDate) {
                dateStr = req.query.startDate as string;
            } else {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                dateStr = startDate.toISOString().split('T')[0];
            }

            if (req.query.endDate) {
                endDateStr = `&endDate=${req.query.endDate as string}`;
            }

            const apiUrl = `https://api.nasa.gov/DONKI/notifications?startDate=${dateStr}${endDateStr}&type=all&api_key=${apiKey}`;

            console.log(`[Proxy] Fetching: ${apiUrl.replace(apiKey, '***')}`);
            const response = await fetch(apiUrl, { signal: controller.signal });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Proxy] NASA API Error ${response.status}: ${errorText.slice(0, 200)}`);
                return res.status(response.status).json({
                    message: "NASA API Error",
                    details: errorText.slice(0, 100)
                });
            }

            // Safe Parse
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                res.json(data);
            } catch (parseError) {
                console.error("[Proxy] JSON Parse Error on:", text.slice(0, 100));
                res.status(500).json({ message: "Invalid JSON from NASA API" });
            }

        } catch (error: any) {
            clearTimeout(timeout);
            console.error("[Proxy] Critical Failure:", error.message);
            if (error.name === 'AbortError') {
                return res.status(504).json({ message: "NASA API Timeout (Gateway Timeout)" });
            }
            res.status(500).json({ message: "Internal Proxy Error", error: error.message });
        }
    });

    // --- Proxy API (Critical for AutonomousPlanner) ---
    app.get("/api/proxy-json", async (req, res) => {
        const url = req.query.url as string;
        if (!url) {
            return res.status(400).send("Missing url parameter");
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                return res.status(response.status).send(`Failed to fetch remote URL: ${response.statusText}`);
            }
            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error("Proxy error:", error);
            res.status(500).send("Internal Server Error during proxy request");
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}
