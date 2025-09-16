import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping existing structure)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Missions table - core spacecraft missions tracking
export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  missionId: text("mission_id").notNull().unique(), // e.g., "ODIN-001"
  status: text("status").notNull().default("planning"), // planning, active, completed, cancelled
  launchDate: timestamp("launch_date", { withTimezone: true }),
  arrivalDate: timestamp("arrival_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`NOW()`),
  trajectoryData: jsonb("trajectory_data"), // Store trajectory calculations
  threatEvents: jsonb("threat_events"), // Associated threat events
  currentProgress: real("current_progress").default(0), // Mission progress percentage
  threatLevel: text("threat_level").default("low"), // low, medium, high, critical
});

// Space Weather Data table - historical solar activity and space conditions
export const spaceWeather = pgTable("space_weather", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  solarFlux: real("solar_flux"), // Solar flux measurements
  geomagneticIndex: real("geomagnetic_index"), // Kp/Ap index
  solarWindSpeed: real("solar_wind_speed"), // km/s
  solarWindDensity: real("solar_wind_density"), // particles/cm³
  solarEvents: jsonb("solar_events"), // Solar flares, CMEs, etc.
  radiationLevel: real("radiation_level"), // Radiation measurements
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`NOW()`),
});

// Threat Events table - detected threats to missions
export const threatEvents = pgTable("threat_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id, { onDelete: "cascade" }),
  threatId: text("threat_id").notNull().unique(), // e.g., "SOL-001", "DEB-002"
  type: text("type").notNull(), // solar_flare, space_debris, radiation_exposure, communication_blackout
  severity: text("severity").notNull(), // low, medium, high, critical
  probability: real("probability").notNull(), // 0-100 percentage
  timeToEvent: text("time_to_event"), // Human readable time estimate
  impact: text("impact").notNull(), // Description of potential impact
  recommendation: text("recommendation").notNull(), // AI recommendation
  status: text("status").default("active"), // active, mitigated, resolved, ignored
  detectedAt: timestamp("detected_at", { withTimezone: true }).default(sql`NOW()`),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  metadata: jsonb("metadata"), // Additional threat-specific data
});

// AI Decisions table - logging AI decision-making process
export const aiDecisions = pgTable("ai_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionId: text("decision_id").notNull().unique(), // e.g., "DEC-001"
  missionId: varchar("mission_id").references(() => missions.id, { onDelete: "cascade" }),
  threatEventId: varchar("threat_event_id").references(() => threatEvents.id),
  timestamp: timestamp("timestamp", { withTimezone: true }).default(sql`NOW()`),
  threatDetected: text("threat_detected").notNull(),
  originalTrajectory: text("original_trajectory").notNull(),
  selectedTrajectory: text("selected_trajectory").notNull(),
  reasoning: text("reasoning").notNull(), // AI's natural language explanation
  tradeOffs: jsonb("trade_offs").notNull(), // Fuel, time, safety, etc. impacts
  alternatives: jsonb("alternatives"), // Other trajectory options considered
  confidence: real("confidence").notNull(), // AI confidence score 0-100
  status: text("status").default("pending"), // pending, implemented, active, completed, rejected
  implementedAt: timestamp("implemented_at", { withTimezone: true }),
  feedback: text("feedback"), // Human feedback on the decision
  outcome: text("outcome"), // Actual results after implementation
});

// Trajectories table - calculated trajectory data and parameters
export const trajectories = pgTable("trajectories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id, { onDelete: "cascade" }),
  decisionId: varchar("decision_id").references(() => aiDecisions.id),
  name: text("name").notNull(), // e.g., "Direct Hohmann Transfer", "L1 Lagrange Route"
  type: text("type").notNull(), // hohmann, bi_elliptic, lambert, custom
  launchWindow: timestamp("launch_window", { withTimezone: true }),
  totalDeltaV: real("total_delta_v"), // Total ΔV in km/s
  flightTime: real("flight_time"), // Flight time in hours
  fuelMass: real("fuel_mass"), // Required fuel mass in kg
  efficiency: real("efficiency"), // Fuel efficiency percentage
  trajectoryPoints: jsonb("trajectory_points"), // Array of coordinate points
  orbitalElements: jsonb("orbital_elements"), // Orbital mechanics data
  riskFactors: jsonb("risk_factors"), // Associated risks and mitigations
  calculations: jsonb("calculations"), // Detailed calculation results
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`NOW()`),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpaceWeatherSchema = createInsertSchema(spaceWeather).omit({
  id: true,
  createdAt: true,
});

export const insertThreatEventSchema = createInsertSchema(threatEvents).omit({
  id: true,
  detectedAt: true,
});

export const insertAiDecisionSchema = createInsertSchema(aiDecisions).omit({
  id: true,
  timestamp: true,
});

export const insertTrajectorySchema = createInsertSchema(trajectories).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

export type InsertSpaceWeather = z.infer<typeof insertSpaceWeatherSchema>;
export type SpaceWeather = typeof spaceWeather.$inferSelect;

export type InsertThreatEvent = z.infer<typeof insertThreatEventSchema>;
export type ThreatEvent = typeof threatEvents.$inferSelect;

export type InsertAiDecision = z.infer<typeof insertAiDecisionSchema>;
export type AiDecision = typeof aiDecisions.$inferSelect;

export type InsertTrajectory = z.infer<typeof insertTrajectorySchema>;
export type Trajectory = typeof trajectories.$inferSelect;
