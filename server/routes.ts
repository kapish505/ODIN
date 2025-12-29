import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "./db";
import { missions, logs } from "./schema";
import { desc, eq } from "drizzle-orm";
// node-fetch not required for Node 18+

export function registerRoutes(app: Express): Server {
    setupAuth(app);

    // --- Missions API ---
    app.get("/api/missions", async (req, res) => {
        try {
            const allMissions = await db.select().from(missions).orderBy(desc(missions.launchDate));
            res.json(allMissions);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch missions" });
        }
    });

    // --- Logs API ---
    app.get("/api/logs", async (req, res) => {
        try {
            const recentLogs = await db.select().from(logs).orderBy(desc(logs.timestamp)).limit(50);
            res.json(recentLogs);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch logs" });
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
            res.status(500).json({ message: "Failed to create log" });
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
