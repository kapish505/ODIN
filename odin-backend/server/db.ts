import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// When DATABASE_URL is not set, we export null placeholders.
// The app will fall back to an in-memory storage implementation.
const hasDbUrl = !!process.env.DATABASE_URL;

export const pool = hasDbUrl ? new Pool({ connectionString: process.env.DATABASE_URL }) : null as any;
export const db = hasDbUrl ? drizzle({ client: pool, schema }) : null as any;
