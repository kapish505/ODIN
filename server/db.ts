import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.warn(
        "DATABASE_URL not set. The application will fail to connect to the database. Please provide a valid connection string."
    );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/db" });
export const db = drizzle(pool, { schema });
