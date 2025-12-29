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
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            threatDetected: "Orbital Debris (NORAD ID 45920)",
            originalTrajectory: "Standard LEO Departure",
            selectedTrajectory: "Inclination Change (+2.3°)",
            reasoning: "Predicted conjunction with spent upper stage debris (risk > 1:1000). A plane change maneuver of 2.3 degrees places the craft outside the debris shell ellipsoid. This consumes reserve station-keeping fuel but ensures collision avoidance.",
            tradeOffs: { "fuelCost": "+3.5%", "travelTime": "+45 minutes", "collisionRisk": "-99.9%", "safetyScore": "OPTIMAL" },
            status: "COMPLETED",
            confidence: 98.4
        },
        {
            id: 3,
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            threatDetected: "Thermal Subsystem Anomaly",
            originalTrajectory: "Passive Thermal Roll",
            selectedTrajectory: "Active Radiator Deployment",
            reasoning: "Telemetry indicated Loop B coolant pressure drop. AI logic determined passive roll insufficient to dissipate heat load. Commanded immediate deployment of auxiliary radiator panels to maintain cabin temperature within nominal range.",
            tradeOffs: { "powerDraw": "+150W", "dragProfile": "High", "thermalStability": "RESTORED", "crewComfort": "NOMINAL" },
            status: "COMPLETED",
            confidence: 96.2
        }
    ];

    // --- Missions API ---
    app.get("/api/missions", async (req, res) => {
        try {
            if (!db) throw new Error("No DB");
            const allMissions = await db.select().from(missions).orderBy(desc(missions.launchDate));
            res.json(allMissions);
        } catch (error) {
            console.warn("[Missions] Serving Memory Data (DB Unavailable)");
            res.json(memoryMissions);
        }
    });

    // --- Logs API ---
    app.get("/api/logs", async (req, res) => {
        try {
            if (!db) throw new Error("No DB");
            const recentLogs = await db.select().from(logs).orderBy(desc(logs.timestamp)).limit(50);
            res.json(recentLogs);
        } catch (error) {
            res.json([]);
        }
    });

    app.post("/api/logs", async (req, res) => {
        try {
            if (!db) throw new Error("No DB");
            const { type, message, meta } = req.body;
            const [newLog] = await db.insert(logs).values({
                type,
                message,
                meta: meta || {},
                timestamp: new Date()
            }).returning();
            res.json(newLog);
        } catch (error) {
            res.status(200).json({ id: 0, type: "INFO", message: "Log (Memory)", timestamp: new Date() });
        }
    });

    // --- AI Decisions API ---
    app.get("/api/ai/decisions", async (req, res) => {
        try {
            if (!db) throw new Error("No DB");
            const allDecisions = await db.select().from(decisions).orderBy(desc(decisions.timestamp));
            res.json(allDecisions);
        } catch (error) {
            console.warn("[Decisions] Serving Memory Data (DB Unavailable)");
            res.json(memoryDecisions);
        }
    });

    // --- Data Seeding (Safe) ---
    (async () => {
        if (!db) {
            console.log("Skipping DB seeding (Running in Memory Mode)");
            return;
        }
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
                    }
                ]);
            }
        } catch (error) {
            console.warn("Seeding failed slightly:", error);
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
