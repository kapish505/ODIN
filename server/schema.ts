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
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // 'INFO', 'WARNING', 'ERROR', 'SUCCESS'
  message: text("message").notNull(),
  meta: jsonb("meta").$type<Record<string, any>>(),
});

export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  threatDetected: text("threat_detected").notNull(),
  originalTrajectory: text("original_trajectory").notNull(),
  selectedTrajectory: text("selected_trajectory").notNull(),
  reasoning: text("reasoning").notNull(),
  tradeOffs: jsonb("trade_offs").notNull().$type<Record<string, string>>(),
  status: text("status").notNull(), // 'Implemented', 'Active', 'Completed', 'Rejected'
  confidence: integer("confidence").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertMissionSchema = createInsertSchema(missions);
export const selectMissionSchema = createSelectSchema(missions);
export const insertLogSchema = createInsertSchema(logs);
export const selectLogSchema = createSelectSchema(logs);
export const insertDecisionSchema = createInsertSchema(decisions);
export const selectDecisionSchema = createSelectSchema(decisions);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
