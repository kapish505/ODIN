import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("Planning"), // Active, Planning, Completed
  progress: integer("progress").notNull().default(0),
  launchDate: timestamp("launch_date"),
  arrivalDate: timestamp("arrival_date"),
  threatLevel: text("threat_level").default("Low"), // Low, Medium, High
  description: text("description"),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // info, warn, error, decision
  message: text("message").notNull(),
  meta: jsonb("meta"),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertMissionSchema = createInsertSchema(missions);
export const selectMissionSchema = createSelectSchema(missions);
export const insertLogSchema = createInsertSchema(logs);
export const selectLogSchema = createSelectSchema(logs);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
