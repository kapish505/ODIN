import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set. Running in memory-only mode.");
}

// Only create the pool if we have a real URL, otherwise export undefined
// This prevents 'FUNCTION_INVOCATION_FAILED' on Vercel startup
export const db = process.env.DATABASE_URL
    ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
    : undefined as any;
