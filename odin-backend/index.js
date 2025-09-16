var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
var vite_config_exports = {};
__export(vite_config_exports, {
  default: () => vite_config_default
});
var vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    vite_config_default = {};
  }
});

// index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiDecisions: () => aiDecisions,
  insertAiDecisionSchema: () => insertAiDecisionSchema,
  insertMissionSchema: () => insertMissionSchema,
  insertSpaceWeatherSchema: () => insertSpaceWeatherSchema,
  insertThreatEventSchema: () => insertThreatEventSchema,
  insertTrajectorySchema: () => insertTrajectorySchema,
  insertUserSchema: () => insertUserSchema,
  missions: () => missions,
  spaceWeather: () => spaceWeather,
  threatEvents: () => threatEvents,
  trajectories: () => trajectories,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  missionId: text("mission_id").notNull().unique(),
  // e.g., "ODIN-001"
  status: text("status").notNull().default("planning"),
  // planning, active, completed, cancelled
  launchDate: timestamp("launch_date", { withTimezone: true }),
  arrivalDate: timestamp("arrival_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`NOW()`),
  trajectoryData: jsonb("trajectory_data"),
  // Store trajectory calculations
  threatEvents: jsonb("threat_events"),
  // Associated threat events
  currentProgress: real("current_progress").default(0),
  // Mission progress percentage
  threatLevel: text("threat_level").default("low")
  // low, medium, high, critical
});
var spaceWeather = pgTable("space_weather", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  solarFlux: real("solar_flux"),
  // Solar flux measurements
  geomagneticIndex: real("geomagnetic_index"),
  // Kp/Ap index
  solarWindSpeed: real("solar_wind_speed"),
  // km/s
  solarWindDensity: real("solar_wind_density"),
  // particles/cm³
  solarEvents: jsonb("solar_events"),
  // Solar flares, CMEs, etc.
  radiationLevel: real("radiation_level"),
  // Radiation measurements
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`NOW()`)
});
var threatEvents = pgTable("threat_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id, { onDelete: "cascade" }),
  threatId: text("threat_id").notNull().unique(),
  // e.g., "SOL-001", "DEB-002"
  type: text("type").notNull(),
  // solar_flare, space_debris, radiation_exposure, communication_blackout
  severity: text("severity").notNull(),
  // low, medium, high, critical
  probability: real("probability").notNull(),
  // 0-100 percentage
  timeToEvent: text("time_to_event"),
  // Human readable time estimate
  impact: text("impact").notNull(),
  // Description of potential impact
  recommendation: text("recommendation").notNull(),
  // AI recommendation
  status: text("status").default("active"),
  // active, mitigated, resolved, ignored
  detectedAt: timestamp("detected_at", { withTimezone: true }).default(sql`NOW()`),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  metadata: jsonb("metadata")
  // Additional threat-specific data
});
var aiDecisions = pgTable("ai_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionId: text("decision_id").notNull().unique(),
  // e.g., "DEC-001"
  missionId: varchar("mission_id").references(() => missions.id, { onDelete: "cascade" }),
  threatEventId: varchar("threat_event_id").references(() => threatEvents.id),
  timestamp: timestamp("timestamp", { withTimezone: true }).default(sql`NOW()`),
  threatDetected: text("threat_detected").notNull(),
  originalTrajectory: text("original_trajectory").notNull(),
  selectedTrajectory: text("selected_trajectory").notNull(),
  reasoning: text("reasoning").notNull(),
  // AI's natural language explanation
  tradeOffs: jsonb("trade_offs").notNull(),
  // Fuel, time, safety, etc. impacts
  alternatives: jsonb("alternatives"),
  // Other trajectory options considered
  confidence: real("confidence").notNull(),
  // AI confidence score 0-100
  status: text("status").default("pending"),
  // pending, implemented, active, completed, rejected
  implementedAt: timestamp("implemented_at", { withTimezone: true }),
  feedback: text("feedback"),
  // Human feedback on the decision
  outcome: text("outcome")
  // Actual results after implementation
});
var trajectories = pgTable("trajectories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id, { onDelete: "cascade" }),
  decisionId: varchar("decision_id").references(() => aiDecisions.id),
  name: text("name").notNull(),
  // e.g., "Direct Hohmann Transfer", "L1 Lagrange Route"
  type: text("type").notNull(),
  // hohmann, bi_elliptic, lambert, custom
  launchWindow: timestamp("launch_window", { withTimezone: true }),
  totalDeltaV: real("total_delta_v"),
  // Total ΔV in km/s
  flightTime: real("flight_time"),
  // Flight time in hours
  fuelMass: real("fuel_mass"),
  // Required fuel mass in kg
  efficiency: real("efficiency"),
  // Fuel efficiency percentage
  trajectoryPoints: jsonb("trajectory_points"),
  // Array of coordinate points
  orbitalElements: jsonb("orbital_elements"),
  // Orbital mechanics data
  riskFactors: jsonb("risk_factors"),
  // Associated risks and mitigations
  calculations: jsonb("calculations"),
  // Detailed calculation results
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`NOW()`)
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSpaceWeatherSchema = createInsertSchema(spaceWeather).omit({
  id: true,
  createdAt: true
});
var insertThreatEventSchema = createInsertSchema(threatEvents).omit({
  id: true,
  detectedAt: true
});
var insertAiDecisionSchema = createInsertSchema(aiDecisions).omit({
  id: true,
  timestamp: true
});
var insertTrajectorySchema = createInsertSchema(trajectories).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var hasDbUrl = !!process.env.DATABASE_URL;
var pool = hasDbUrl ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
var db = hasDbUrl ? drizzle({ client: pool, schema: schema_exports }) : null;

// server/storage.ts
import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";
var PostgresStorage = class {
  // Users
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword
    };
    const result = await db.insert(users).values(userWithHashedPassword).returning();
    return result[0];
  }
  async verifyPassword(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
  // Missions
  async getMission(id) {
    const result = await db.select().from(missions).where(eq(missions.id, id)).limit(1);
    return result[0];
  }
  async getMissionByMissionId(missionId) {
    const result = await db.select().from(missions).where(eq(missions.missionId, missionId)).limit(1);
    return result[0];
  }
  async getAllMissions() {
    return await db.select().from(missions).orderBy(desc(missions.createdAt));
  }
  async getActiveMissions() {
    return await db.select().from(missions).where(or(eq(missions.status, "active"), eq(missions.status, "planning"))).orderBy(desc(missions.createdAt));
  }
  async createMission(mission) {
    const result = await db.insert(missions).values(mission).returning();
    return result[0];
  }
  async updateMission(id, updates) {
    const result = await db.update(missions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(missions.id, id)).returning();
    return result[0];
  }
  async deleteMission(id) {
    const result = await db.delete(missions).where(eq(missions.id, id)).returning();
    return result.length > 0;
  }
  // Space Weather Data
  async getSpaceWeatherByTimeRange(startTime, endTime) {
    return await db.select().from(spaceWeather).where(and(
      gte(spaceWeather.timestamp, startTime),
      lte(spaceWeather.timestamp, endTime)
    )).orderBy(desc(spaceWeather.timestamp));
  }
  async getLatestSpaceWeather() {
    const result = await db.select().from(spaceWeather).orderBy(desc(spaceWeather.timestamp)).limit(1);
    return result[0];
  }
  async createSpaceWeather(data) {
    const result = await db.insert(spaceWeather).values(data).returning();
    return result[0];
  }
  // Threat Events
  async getThreatEvent(id) {
    const result = await db.select().from(threatEvents).where(eq(threatEvents.id, id)).limit(1);
    return result[0];
  }
  async getThreatEventsByMission(missionId) {
    return await db.select().from(threatEvents).where(eq(threatEvents.missionId, missionId)).orderBy(desc(threatEvents.detectedAt));
  }
  async getActiveThreatEvents() {
    return await db.select().from(threatEvents).where(eq(threatEvents.status, "active")).orderBy(desc(threatEvents.detectedAt));
  }
  async createThreatEvent(event) {
    const result = await db.insert(threatEvents).values(event).returning();
    return result[0];
  }
  async updateThreatEvent(id, updates) {
    const result = await db.update(threatEvents).set(updates).where(eq(threatEvents.id, id)).returning();
    return result[0];
  }
  async resolveThreatEvent(id) {
    const result = await db.update(threatEvents).set({ status: "resolved", resolvedAt: /* @__PURE__ */ new Date() }).where(eq(threatEvents.id, id)).returning();
    return result.length > 0;
  }
  // AI Decisions
  async getAiDecision(id) {
    const result = await db.select().from(aiDecisions).where(eq(aiDecisions.id, id)).limit(1);
    return result[0];
  }
  async getAiDecisionsByMission(missionId) {
    return await db.select().from(aiDecisions).where(eq(aiDecisions.missionId, missionId)).orderBy(desc(aiDecisions.timestamp));
  }
  async getAllAiDecisions() {
    return await db.select().from(aiDecisions).orderBy(desc(aiDecisions.timestamp));
  }
  async createAiDecision(decision) {
    const result = await db.insert(aiDecisions).values(decision).returning();
    return result[0];
  }
  async updateAiDecision(id, updates) {
    const result = await db.update(aiDecisions).set(updates).where(eq(aiDecisions.id, id)).returning();
    return result[0];
  }
  // Trajectories
  async getTrajectory(id) {
    const result = await db.select().from(trajectories).where(eq(trajectories.id, id)).limit(1);
    return result[0];
  }
  async getTrajectoriesByMission(missionId) {
    return await db.select().from(trajectories).where(eq(trajectories.missionId, missionId)).orderBy(desc(trajectories.createdAt));
  }
  async getActiveTrajectoryForMission(missionId) {
    const result = await db.select().from(trajectories).where(and(
      eq(trajectories.missionId, missionId),
      eq(trajectories.isActive, true)
    )).limit(1);
    return result[0];
  }
  async createTrajectory(trajectory) {
    const result = await db.insert(trajectories).values(trajectory).returning();
    return result[0];
  }
  async updateTrajectory(id, updates) {
    const result = await db.update(trajectories).set(updates).where(eq(trajectories.id, id)).returning();
    return result[0];
  }
  async setActiveTrajectory(missionId, trajectoryId) {
    const result = await db.transaction(async (tx) => {
      await tx.update(trajectories).set({ isActive: false }).where(eq(trajectories.missionId, missionId));
      const updateResult = await tx.update(trajectories).set({ isActive: true }).where(and(
        eq(trajectories.id, trajectoryId),
        eq(trajectories.missionId, missionId)
      )).returning();
      return updateResult.length > 0;
    });
    return result;
  }
};
var InMemoryStorage = class {
  users = /* @__PURE__ */ new Map();
  missions = /* @__PURE__ */ new Map();
  spaceWeather = /* @__PURE__ */ new Map();
  threatEvents = /* @__PURE__ */ new Map();
  aiDecisions = /* @__PURE__ */ new Map();
  trajectories = /* @__PURE__ */ new Map();
  nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
  genId() {
    return this.nano();
  }
  // Users
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    for (const u of this.users.values()) if (u.username === username) return u;
    return void 0;
  }
  async createUser(user) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    const newUser = { id: this.genId(), username: user.username, password: hashedPassword };
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  async verifyPassword(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  }
  // Missions
  async getMission(id) {
    return this.missions.get(id);
  }
  async getMissionByMissionId(missionId) {
    for (const m of this.missions.values()) if (m.missionId === missionId) return m;
    return void 0;
  }
  async getAllMissions() {
    return Array.from(this.missions.values()).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  }
  async getActiveMissions() {
    return (await this.getAllMissions()).filter((m) => m.status === "active" || m.status === "planning");
  }
  async createMission(mission) {
    const now = /* @__PURE__ */ new Date();
    const m = {
      id: this.genId(),
      createdAt: now,
      updatedAt: now,
      threatLevel: "low",
      currentProgress: 0,
      threatEvents: mission.threatEvents,
      trajectoryData: mission.trajectoryData,
      name: mission.name,
      missionId: mission.missionId,
      status: mission.status ?? "planning",
      launchDate: mission.launchDate,
      arrivalDate: mission.arrivalDate
    };
    this.missions.set(m.id, m);
    return m;
  }
  async updateMission(id, updates) {
    const existing = this.missions.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.missions.set(id, updated);
    return updated;
  }
  async deleteMission(id) {
    return this.missions.delete(id);
  }
  // Space Weather
  async getSpaceWeatherByTimeRange(startTime, endTime) {
    return Array.from(this.spaceWeather.values()).filter((s) => s.timestamp >= startTime && s.timestamp <= endTime).sort((a, b) => b.timestamp - a.timestamp);
  }
  async getLatestSpaceWeather() {
    return (await this.getSpaceWeatherByTimeRange(/* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date()))[0];
  }
  async createSpaceWeather(data) {
    const rec = { id: this.genId(), createdAt: /* @__PURE__ */ new Date(), ...data };
    this.spaceWeather.set(rec.id, rec);
    return rec;
  }
  // Threat Events
  async getThreatEvent(id) {
    return this.threatEvents.get(id);
  }
  async getThreatEventsByMission(missionId) {
    return Array.from(this.threatEvents.values()).filter((t) => t.missionId === missionId).sort((a, b) => (b.detectedAt?.getTime?.() || 0) - (a.detectedAt?.getTime?.() || 0));
  }
  async getActiveThreatEvents() {
    return Array.from(this.threatEvents.values()).filter((t) => t.status === "active").sort((a, b) => (b.detectedAt?.getTime?.() || 0) - (a.detectedAt?.getTime?.() || 0));
  }
  async createThreatEvent(event) {
    const rec = { id: this.genId(), status: "active", detectedAt: /* @__PURE__ */ new Date(), ...event };
    this.threatEvents.set(rec.id, rec);
    return rec;
  }
  async updateThreatEvent(id, updates) {
    const existing = this.threatEvents.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.threatEvents.set(id, updated);
    return updated;
  }
  async resolveThreatEvent(id) {
    const existing = this.threatEvents.get(id);
    if (!existing) return false;
    existing.status = "resolved";
    existing.resolvedAt = /* @__PURE__ */ new Date();
    this.threatEvents.set(id, existing);
    return true;
  }
  // AI Decisions
  async getAiDecision(id) {
    return this.aiDecisions.get(id);
  }
  async getAiDecisionsByMission(missionId) {
    return Array.from(this.aiDecisions.values()).filter((d) => d.missionId === missionId).sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
  }
  async getAllAiDecisions() {
    return Array.from(this.aiDecisions.values()).sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
  }
  async createAiDecision(decision) {
    const rec = { id: this.genId(), timestamp: /* @__PURE__ */ new Date(), ...decision };
    this.aiDecisions.set(rec.id, rec);
    return rec;
  }
  async updateAiDecision(id, updates) {
    const existing = this.aiDecisions.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.aiDecisions.set(id, updated);
    return updated;
  }
  // Trajectories
  async getTrajectory(id) {
    return this.trajectories.get(id);
  }
  async getTrajectoriesByMission(missionId) {
    return Array.from(this.trajectories.values()).filter((t) => t.missionId === missionId).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  }
  async getActiveTrajectoryForMission(missionId) {
    return Array.from(this.trajectories.values()).find((t) => t.missionId === missionId && t.isActive === true);
  }
  async createTrajectory(trajectory) {
    const rec = { id: this.genId(), createdAt: /* @__PURE__ */ new Date(), isActive: false, ...trajectory };
    this.trajectories.set(rec.id, rec);
    return rec;
  }
  async updateTrajectory(id, updates) {
    const existing = this.trajectories.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.trajectories.set(id, updated);
    return updated;
  }
  async setActiveTrajectory(missionId, trajectoryId) {
    let changed = false;
    for (const t of this.trajectories.values()) {
      if (t.missionId === missionId) {
        if (t.id === trajectoryId) {
          t.isActive = true;
          changed = true;
        } else {
          t.isActive = false;
        }
      }
    }
    return changed;
  }
};
var storage = process.env.DATABASE_URL ? new PostgresStorage() : new InMemoryStorage();

// server/trajectory-engine.ts
var UnitConverter = class _UnitConverter {
  // Time conversions
  static SECONDS_PER_HOUR = 3600;
  static HOURS_PER_SECOND = 1 / 3600;
  static SECONDS_PER_DAY = 86400;
  // Distance conversions
  static METERS_PER_KM = 1e3;
  static KM_PER_METER = 1 / 1e3;
  // Velocity conversions  
  static MS_PER_KMS = 1e3;
  static KMS_PER_MS = 1 / 1e3;
  /**
   * Convert time from hours to seconds (API boundary → internal calculations)
   */
  static hoursToSeconds(hours) {
    if (hours < 0) {
      throw new Error("Time cannot be negative");
    }
    if (!isFinite(hours)) {
      throw new Error("Time must be finite");
    }
    return hours * _UnitConverter.SECONDS_PER_HOUR;
  }
  /**
   * Convert time from seconds to hours (internal calculations → API boundary)
   */
  static secondsToHours(seconds) {
    if (seconds < 0) {
      throw new Error("Time cannot be negative");
    }
    if (!isFinite(seconds)) {
      throw new Error("Time must be finite");
    }
    return seconds * _UnitConverter.HOURS_PER_SECOND;
  }
  /**
   * Convert velocity from km/s to m/s (API boundary → internal calculations)
   */
  static kmPerSecToMPerSec(kmPerSec) {
    if (!isFinite(kmPerSec)) {
      throw new Error("Velocity must be finite");
    }
    return kmPerSec * _UnitConverter.MS_PER_KMS;
  }
  /**
   * Convert velocity from m/s to km/s (internal calculations → API boundary)
   */
  static mPerSecToKmPerSec(mPerSec) {
    if (!isFinite(mPerSec)) {
      throw new Error("Velocity must be finite");
    }
    return mPerSec * _UnitConverter.KMS_PER_MS;
  }
  /**
   * Validate that a time value is reasonable for space missions
   */
  static validateMissionTime(hours) {
    if (hours < 0.1) {
      throw new Error("Mission time too short (minimum 6 minutes)");
    }
    if (hours > 8760) {
      throw new Error("Mission time too long (maximum 1 year)");
    }
  }
  /**
   * Validate that a delta-V value is reasonable for space missions
   */
  static validateDeltaV(deltaV_kms) {
    if (deltaV_kms < 0) {
      throw new Error("Delta-V cannot be negative");
    }
    if (deltaV_kms > 20) {
      throw new Error("Delta-V exceeds reasonable chemical propulsion limits (>20 km/s)");
    }
  }
};
var CONSTANTS = {
  // Gravitational parameters (km³/s²)
  MU_EARTH: 398600.4418,
  // Earth
  MU_MOON: 4902.7779,
  // Moon
  // Orbital radii (km)
  EARTH_RADIUS: 6371,
  MOON_RADIUS: 1737,
  EARTH_MOON_DISTANCE: 384400,
  EARTH_LOW_ORBIT: 200,
  // LEO altitude
  MOON_ORBIT_ALT: 100,
  // Lunar orbit altitude
  // Mission parameters
  SPECIFIC_IMPULSE: 450,
  // seconds (chemical propulsion)
  SPACECRAFT_DRY_MASS: 5e3
  // kg
};
var Vector3D = class _Vector3D {
  constructor(x, y, z2) {
    this.x = x;
    this.y = y;
    this.z = z2;
  }
  static add(a, b) {
    return new _Vector3D(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  static subtract(a, b) {
    return new _Vector3D(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  static multiply(v, scalar) {
    return new _Vector3D(v.x * scalar, v.y * scalar, v.z * scalar);
  }
  static dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  static cross(a, b) {
    return new _Vector3D(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  normalize() {
    const mag = this.magnitude();
    return new _Vector3D(this.x / mag, this.y / mag, this.z / mag);
  }
};
var LambertSolver = class {
  static solve(r1, r2, timeOfFlight, mu = CONSTANTS.MU_EARTH, prograde = true, multiRevs = 0) {
    const tolerance = 1e-14;
    const maxIterations = 30;
    const r1_mag = r1.magnitude();
    const r2_mag = r2.magnitude();
    if (r1_mag < 1e-6 || r2_mag < 1e-6) {
      throw new Error("Invalid position vectors: magnitudes too small");
    }
    if (timeOfFlight <= 0) {
      throw new Error("Time of flight must be positive");
    }
    if (mu <= 0) {
      throw new Error("Gravitational parameter must be positive");
    }
    const c = Vector3D.subtract(r2, r1).magnitude();
    const s = (r1_mag + r2_mag + c) / 2;
    if (c < 1e-6) {
      throw new Error("Degenerate Lambert problem: positions too close");
    }
    const cos_dnu = Vector3D.dot(r1, r2) / (r1_mag * r2_mag);
    const cos_dnu_clamped = Math.max(-1, Math.min(1, cos_dnu));
    const cross_product = Vector3D.cross(r1, r2);
    const sin_dnu = cross_product.magnitude() / (r1_mag * r2_mag);
    let dnu;
    if (prograde) {
      dnu = Math.atan2(sin_dnu, cos_dnu_clamped);
      if (dnu < 0) dnu += 2 * Math.PI;
    } else {
      dnu = Math.atan2(sin_dnu, cos_dnu_clamped);
      if (dnu < 0) dnu += 2 * Math.PI;
      dnu = 2 * Math.PI - dnu;
    }
    const T = Math.sqrt(2 * mu / (s * s * s)) * timeOfFlight;
    const lambda = Math.sqrt(r1_mag * r2_mag) * Math.cos(dnu / 2) / s;
    if (Math.abs(lambda) >= 1) {
      throw new Error("Lambert problem: impossible geometry (lambda >= 1)");
    }
    let x;
    if (multiRevs === 0) {
      const T_min = IzzoSolver.computeMinimumEnergyTime(lambda);
      if (T < T_min) {
        throw new Error(`Time of flight too short. Minimum: ${T_min}, given: ${T}`);
      }
      x = IzzoSolver.solveForX(lambda, T, tolerance, maxIterations);
    } else {
      throw new Error("Multi-revolution Lambert transfers not implemented");
    }
    const { f, g, fdot, gdot } = IzzoSolver.calculateLagrangeCoefficients(
      x,
      lambda,
      r1_mag,
      r2_mag,
      s,
      T,
      timeOfFlight,
      mu
    );
    const determinant = f * gdot - fdot * g;
    if (Math.abs(determinant - 1) > 1e-10) {
      console.warn(`Lagrange coefficients determinant error: ${Math.abs(determinant - 1)}`);
    }
    if (Math.abs(g) < 1e-15) {
      throw new Error("Lambert solver: g coefficient too small, singular solution");
    }
    const v1 = Vector3D.multiply(
      Vector3D.subtract(r2, Vector3D.multiply(r1, f)),
      1 / g
    );
    const v2 = Vector3D.add(
      Vector3D.multiply(v1, fdot),
      Vector3D.multiply(r1, gdot / g)
    );
    return {
      velocityDeparture: v1,
      velocityArrival: v2,
      convergenceIterations: maxIterations,
      // Placeholder - Izzo typically converges very fast
      solutionType: prograde ? "prograde" : "retrograde"
    };
  }
};
var IzzoSolver = class _IzzoSolver {
  /**
   * Compute minimum energy transfer time (parabolic limit)
   */
  static computeMinimumEnergyTime(lambda) {
    const T_min = 1 / 3 * (1 - lambda * lambda * lambda);
    return T_min;
  }
  /**
   * Solve for the x parameter using Householder's method
   * This is the core of the Izzo algorithm
   */
  static solveForX(lambda, T, tolerance, maxIterations) {
    let x;
    if (T >= 1 / 3) {
      x = Math.pow(T * 3, 1 / 3) - 1;
    } else {
      x = 5 * T * T * T / (2 * (1 - lambda * lambda * lambda));
    }
    let iterations = 0;
    let converged = false;
    while (iterations < maxIterations && !converged) {
      const y = _IzzoSolver.calculateY(x, lambda);
      const T_computed = _IzzoSolver.calculateTime(x, y);
      const F = T_computed - T;
      if (Math.abs(F) < tolerance) {
        converged = true;
        break;
      }
      const dT_dx = _IzzoSolver.calculateTimeDerivative(x, y);
      const d2T_dx2 = _IzzoSolver.calculateTimeSecondDerivative(x, y, lambda);
      const denominator = dT_dx - F * d2T_dx2 / (2 * dT_dx);
      if (Math.abs(denominator) < 1e-15) {
        throw new Error("Izzo solver: derivative too small in Householder iteration");
      }
      const delta_x = -F / denominator;
      const max_step = 0.5;
      const limited_delta = Math.sign(delta_x) * Math.min(Math.abs(delta_x), max_step);
      x += limited_delta;
      x = Math.max(-1, Math.min(x, 50));
      iterations++;
    }
    if (!converged) {
      throw new Error(`Izzo solver did not converge after ${maxIterations} iterations`);
    }
    return x;
  }
  /**
   * Calculate y parameter from x and lambda
   */
  static calculateY(x, lambda) {
    return Math.sqrt(1 - lambda * lambda * (1 - x * x));
  }
  /**
   * Calculate normalized time from x and y
   */
  static calculateTime(x, y) {
    if (x < 0) {
      const sqrt_neg_x = Math.sqrt(-x);
      return (Math.asinh(sqrt_neg_x * y) + sqrt_neg_x * y) / Math.pow(-x, 1.5);
    } else if (x > 0) {
      const sqrt_x = Math.sqrt(x);
      if (sqrt_x * y <= 1) {
        return (Math.asin(sqrt_x * y) + sqrt_x * y) / Math.pow(x, 1.5);
      } else {
        return (Math.PI - Math.asin(sqrt_x * y) + sqrt_x * y) / Math.pow(x, 1.5);
      }
    } else {
      return 2 / 3 * (1 - y * y * y);
    }
  }
  /**
   * Calculate first derivative of time with respect to x
   */
  static calculateTimeDerivative(x, y) {
    if (x < 0) {
      const sqrt_neg_x = Math.sqrt(-x);
      return (3 * Math.asinh(sqrt_neg_x * y) + 3 * sqrt_neg_x * y + sqrt_neg_x * y * y * y) / (2 * Math.pow(-x, 2.5));
    } else if (x > 0) {
      const sqrt_x = Math.sqrt(x);
      if (sqrt_x * y <= 1) {
        return (3 * Math.asin(sqrt_x * y) + 3 * sqrt_x * y - sqrt_x * y * y * y) / (2 * Math.pow(x, 2.5));
      } else {
        return (3 * (Math.PI - Math.asin(sqrt_x * y)) + 3 * sqrt_x * y - sqrt_x * y * y * y) / (2 * Math.pow(x, 2.5));
      }
    } else {
      return -y * y;
    }
  }
  /**
   * Calculate second derivative of time with respect to x
   */
  static calculateTimeSecondDerivative(x, y, lambda) {
    const epsilon = 1e-8;
    const dT_dx_plus = _IzzoSolver.calculateTimeDerivative(x + epsilon, _IzzoSolver.calculateY(x + epsilon, lambda));
    const dT_dx_minus = _IzzoSolver.calculateTimeDerivative(x - epsilon, _IzzoSolver.calculateY(x - epsilon, lambda));
    return (dT_dx_plus - dT_dx_minus) / (2 * epsilon);
  }
  /**
   * Calculate Lagrange coefficients from solution
   */
  static calculateLagrangeCoefficients(x, lambda, r1_mag, r2_mag, s, T, timeOfFlight, mu) {
    const y = _IzzoSolver.calculateY(x, lambda);
    const a = s / (2 * (1 - x * x));
    if (a <= 0) {
      throw new Error("Invalid semi-major axis in Lagrange coefficient calculation");
    }
    const sqrt_mu = Math.sqrt(mu);
    const sqrt_a = Math.sqrt(a);
    const f = 1 - a / r1_mag * (1 - x * x);
    const g = a * (s - r1_mag - r2_mag) * sqrt_a / (sqrt_mu * r1_mag * y);
    const gdot = 1 - a / r2_mag * (1 - x * x);
    const fdot = (f * gdot - 1) / g;
    return { f, g, fdot, gdot };
  }
};
var HohmannTransfer = class {
  // Calculate lunar sphere of influence radius
  static getLunarSOI() {
    const earthMoonDistance = CONSTANTS.EARTH_MOON_DISTANCE;
    const massRatio = CONSTANTS.MU_MOON / CONSTANTS.MU_EARTH;
    return earthMoonDistance * Math.pow(massRatio, 2 / 5);
  }
  static calculate(r1, r2, mu = CONSTANTS.MU_EARTH) {
    const a_transfer = (r1 + r2) / 2;
    const v1_circular = Math.sqrt(mu / r1);
    const v2_circular = Math.sqrt(mu / r2);
    const v1_transfer = Math.sqrt(mu * (2 / r1 - 1 / a_transfer));
    const v2_transfer = Math.sqrt(mu * (2 / r2 - 1 / a_transfer));
    const deltaV1 = Math.abs(v1_transfer - v1_circular);
    const deltaV2 = Math.abs(v2_circular - v2_transfer);
    const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu);
    const transferTime = UnitConverter.secondsToHours(transferTimeSeconds);
    const transferOrbit = {
      semiMajorAxis: a_transfer,
      eccentricity: Math.abs(r2 - r1) / (r1 + r2),
      inclination: 0,
      rightAscension: 0,
      argOfPerigee: 0,
      trueAnomaly: 0
    };
    return {
      deltaV1,
      deltaV2,
      transferTime,
      transferOrbit
    };
  }
  /**
   * Earth-Moon Patched Conic Transfer - Production Implementation
   * Uses proper aerospace engineering methods for trajectory calculation
   * Implements proper lunar SOI handling, v∞ matching, and energy conservation
   */
  static calculateEarthMoonTransfer() {
    const r_earth_parking = CONSTANTS.EARTH_RADIUS + CONSTANTS.EARTH_LOW_ORBIT;
    const r_moon_parking = CONSTANTS.MOON_RADIUS + CONSTANTS.MOON_ORBIT_ALT;
    const lunarSOI = this.getLunarSOI();
    const r_earth_moon = CONSTANTS.EARTH_MOON_DISTANCE;
    const r_soi_boundary = r_earth_moon - lunarSOI;
    const v_earth_circular = Math.sqrt(CONSTANTS.MU_EARTH / r_earth_parking);
    const specific_energy_transfer = -CONSTANTS.MU_EARTH / (2 * r_soi_boundary);
    const v_departure_magnitude = Math.sqrt(2 * (specific_energy_transfer + CONSTANTS.MU_EARTH / r_earth_parking));
    const deltaV_earth_escape = v_departure_magnitude - v_earth_circular;
    const v_at_soi_earth_frame = Math.sqrt(2 * CONSTANTS.MU_EARTH / r_soi_boundary);
    const v_moon_orbital = Math.sqrt(CONSTANTS.MU_EARTH / r_earth_moon);
    const v_infinity = Math.abs(v_at_soi_earth_frame - v_moon_orbital);
    const v_soi_entry_lunar_frame = Math.sqrt(v_infinity * v_infinity + 2 * CONSTANTS.MU_MOON / lunarSOI);
    const v_periapsis_capture = Math.sqrt(CONSTANTS.MU_MOON * (2 / r_moon_parking - 2 / (lunarSOI + r_moon_parking)));
    const v_lunar_circular = Math.sqrt(CONSTANTS.MU_MOON / r_moon_parking);
    const deltaV_lunar_capture = v_soi_entry_lunar_frame - v_periapsis_capture;
    const deltaV_lunar_insertion = v_periapsis_capture - v_lunar_circular;
    const total_lunar_deltaV = deltaV_lunar_capture + deltaV_lunar_insertion;
    const earthTransferTime = this.calculateTransferTime(r_earth_parking, r_soi_boundary, CONSTANTS.MU_EARTH);
    const lunarCaptureTime = this.calculateLunarCaptureTime(lunarSOI, r_moon_parking, v_infinity);
    const earthEscape = {
      deltaV1: deltaV_earth_escape,
      deltaV2: 0,
      // Single burn for Earth escape in this model
      transferTime: UnitConverter.secondsToHours(earthTransferTime),
      transferOrbit: {
        semiMajorAxis: (r_earth_parking + r_soi_boundary) / 2,
        eccentricity: Math.abs(r_soi_boundary - r_earth_parking) / (r_earth_parking + r_soi_boundary),
        inclination: 0,
        // Simplified for equatorial transfer
        rightAscension: 0,
        argOfPerigee: 0,
        trueAnomaly: 0
      }
    };
    const lunarCapture = {
      deltaV1: deltaV_lunar_capture,
      // Capture burn
      deltaV2: deltaV_lunar_insertion,
      // Orbit insertion burn
      transferTime: UnitConverter.secondsToHours(lunarCaptureTime),
      transferOrbit: {
        semiMajorAxis: (lunarSOI + r_moon_parking) / 2,
        eccentricity: (lunarSOI - r_moon_parking) / (lunarSOI + r_moon_parking),
        inclination: 0,
        rightAscension: 0,
        argOfPerigee: 0,
        trueAnomaly: 0
      }
    };
    const patchedConicDetails = {
      lunarSOI,
      v_infinity,
      v_at_soi_earth_frame,
      v_soi_entry_lunar_frame,
      moon_orbital_velocity: v_moon_orbital,
      energy_balance_check: this.validateEnergyBalance(
        r_earth_parking,
        r_soi_boundary,
        v_departure_magnitude,
        v_at_soi_earth_frame
      )
    };
    return {
      earthEscape,
      lunarCapture,
      totalDeltaV: deltaV_earth_escape + total_lunar_deltaV,
      totalTime: UnitConverter.secondsToHours(earthTransferTime + lunarCaptureTime),
      lunarSOI,
      v_infinity,
      patchedConicDetails
    };
  }
  /**
   * Calculate transfer time for Earth escape phase using vis-viva equation
   */
  static calculateTransferTime(r1, r2, mu) {
    const a = (r1 + r2) / 2;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
    return period / 2;
  }
  /**
   * Calculate lunar capture and orbit insertion time
   */
  static calculateLunarCaptureTime(r_soi, r_parking, v_infinity) {
    const characteristic_time = Math.sqrt(Math.pow(r_soi, 3) / CONSTANTS.MU_MOON);
    const hyperbolic_factor = 1 + v_infinity * v_infinity * r_soi / (2 * CONSTANTS.MU_MOON);
    return characteristic_time * Math.log(hyperbolic_factor);
  }
  /**
   * Validate energy conservation in patched conic method
   */
  static validateEnergyBalance(r1, r2, v1, v2) {
    const energy1 = v1 * v1 / 2 - CONSTANTS.MU_EARTH / r1;
    const energy2 = v2 * v2 / 2 - CONSTANTS.MU_EARTH / r2;
    const energy_error = Math.abs(energy1 - energy2) / Math.abs(energy1);
    return energy_error < 1e-6;
  }
};
var FuelOptimizer = class {
  static calculate(deltaV, dryMass = CONSTANTS.SPACECRAFT_DRY_MASS, specificImpulse = CONSTANTS.SPECIFIC_IMPULSE, thrustToWeightRatio = 0.3) {
    UnitConverter.validateDeltaV(deltaV);
    if (dryMass <= 0 || !isFinite(dryMass)) {
      throw new Error("Dry mass must be positive and finite");
    }
    if (specificImpulse <= 0 || !isFinite(specificImpulse)) {
      throw new Error("Specific impulse must be positive and finite");
    }
    if (thrustToWeightRatio <= 0 || thrustToWeightRatio > 2) {
      throw new Error("Thrust-to-weight ratio must be between 0 and 2.0");
    }
    const deltaV_ms = UnitConverter.kmPerSecToMPerSec(deltaV);
    const g0 = 9.80665;
    const ve = specificImpulse * g0;
    const massRatio = Math.exp(deltaV_ms / ve);
    if (!isFinite(massRatio) || massRatio < 1) {
      throw new Error("Invalid mass ratio calculated from Tsiolkovsky equation");
    }
    const totalMass = dryMass * massRatio;
    const propellantMass = totalMass - dryMass;
    if (propellantMass < 0) {
      throw new Error("Negative propellant mass calculated");
    }
    if (propellantMass > dryMass * 10) {
      console.warn(`Very high propellant-to-dry mass ratio: ${(propellantMass / dryMass).toFixed(2)}`);
    }
    const burnTime = this.calculateVariableMassBurnTime(
      totalMass,
      dryMass,
      thrustToWeightRatio,
      ve,
      g0
    );
    if (burnTime < 0) {
      throw new Error("Negative burn time calculated");
    }
    if (burnTime > UnitConverter.SECONDS_PER_HOUR) {
      console.warn(`Long burn time ${UnitConverter.secondsToHours(burnTime).toFixed(1)} hours may require multiple burn phases`);
    }
    return {
      massRatio: Number(massRatio.toFixed(4)),
      propellantMass: Number(propellantMass.toFixed(1)),
      specificImpulse,
      burnTime: Number(burnTime.toFixed(1))
    };
  }
  /**
   * Calculate burn time accounting for variable mass during propellant consumption
   * Uses integrated rocket equation for production accuracy
   */
  static calculateVariableMassBurnTime(m0, mf, twRatio, ve, g0) {
    const F = twRatio * m0 * g0;
    const massFlowRate = F / ve;
    const propellantMass = m0 - mf;
    const burnTimeConstantThrust = propellantMass / massFlowRate;
    if (twRatio > 0.5) {
      const characteristicVelocity = ve * Math.log(m0 / mf);
      const gravityLossFactor = this.calculateGravityLossFactor(burnTimeConstantThrust, twRatio);
      const correctedBurnTime = burnTimeConstantThrust * (1 + gravityLossFactor);
      return Math.min(correctedBurnTime, burnTimeConstantThrust * 1.2);
    }
    return burnTimeConstantThrust;
  }
  /**
   * Calculate gravity loss factor for finite burn corrections
   */
  static calculateGravityLossFactor(burnTime, twRatio) {
    if (burnTime < 60) {
      return 0;
    }
    const timeFactor = Math.min(burnTime / 600, 1);
    const thrustFactor = Math.max(0.1, 1 / twRatio);
    return 0.05 * timeFactor * thrustFactor;
  }
  /**
   * Advanced: Calculate burn time for variable thrust profile
   * Used for electric propulsion or throttled engines
   */
  static calculateVariableThrustBurnTime(deltaV, m0, mf, thrustProfile, ve) {
    console.warn("Variable thrust profiles require numerical integration - using constant thrust approximation");
    const avgThrust = 0.5 * (thrustProfile(0) + thrustProfile(1e3));
    const massFlowRate = avgThrust / ve;
    const propellantMass = m0 - mf;
    return propellantMass / massFlowRate;
  }
};
var TrajectoryEngine = class {
  static generateEarthMoonTrajectory(launchDate, transferType = "hohmann", flightTime = 72) {
    if (!launchDate || isNaN(launchDate.getTime())) {
      throw new Error("Invalid launch date provided");
    }
    UnitConverter.validateMissionTime(flightTime);
    const validTypes = ["hohmann", "lambert", "bi_elliptic"];
    if (!validTypes.includes(transferType)) {
      throw new Error(`Invalid transfer type: ${transferType}. Must be one of: ${validTypes.join(", ")}`);
    }
    const r_earth = CONSTANTS.EARTH_RADIUS + CONSTANTS.EARTH_LOW_ORBIT;
    const r_moon = CONSTANTS.MOON_RADIUS + CONSTANTS.MOON_ORBIT_ALT;
    let totalDeltaV = 0;
    let hohmannResult;
    let lambertResult;
    let trajectoryPoints = [];
    let orbitalElements = [];
    if (transferType === "hohmann") {
      const patchedConicTransfer = HohmannTransfer.calculateEarthMoonTransfer();
      hohmannResult = patchedConicTransfer.earthEscape;
      totalDeltaV = patchedConicTransfer.totalDeltaV;
      flightTime = patchedConicTransfer.totalTime;
      trajectoryPoints = generatePatchedConicTrajectoryPoints(
        r_earth,
        CONSTANTS.EARTH_MOON_DISTANCE,
        patchedConicTransfer.lunarSOI,
        100
      );
      orbitalElements = [
        patchedConicTransfer.earthEscape.transferOrbit,
        patchedConicTransfer.lunarCapture.transferOrbit
      ];
    } else if (transferType === "lambert") {
      const r1 = new Vector3D(r_earth, 0, 0);
      const r2 = new Vector3D(CONSTANTS.EARTH_MOON_DISTANCE, 0, 0);
      const flightTimeSeconds = UnitConverter.hoursToSeconds(flightTime);
      lambertResult = LambertSolver.solve(r1, r2, flightTimeSeconds, CONSTANTS.MU_EARTH);
      const v_earth_circular = Math.sqrt(CONSTANTS.MU_EARTH / r_earth);
      const deltaV_departure = lambertResult.velocityDeparture.magnitude() - v_earth_circular;
      const v_moon_circular = Math.sqrt(CONSTANTS.MU_MOON / r_moon);
      const deltaV_arrival = lambertResult.velocityArrival.magnitude() - v_moon_circular;
      totalDeltaV = Math.abs(deltaV_departure) + Math.abs(deltaV_arrival);
      trajectoryPoints = generateLambertTrajectoryPoints(r1, r2, lambertResult, 100);
    }
    const fuelOptimization = FuelOptimizer.calculate(totalDeltaV);
    const riskFactors = assessTrajectoryRisks(transferType, totalDeltaV, flightTime);
    const efficiency = calculateEfficiency(totalDeltaV, r_earth, CONSTANTS.EARTH_MOON_DISTANCE);
    return {
      totalDeltaV: Math.round(totalDeltaV * 1e3) / 1e3,
      // Round to 3 decimal places
      flightTime: Math.round(flightTime * 10) / 10,
      fuelMass: Math.round(fuelOptimization.propellantMass),
      efficiency: Math.round(efficiency * 10) / 10,
      trajectoryPoints,
      orbitalElements,
      riskFactors,
      calculations: {
        hohmannTransfer: hohmannResult,
        lambertSolution: lambertResult,
        fuelOptimization
      }
    };
  }
  /**
   * Generate trajectory data for database storage
   */
  static generateTrajectoryRecord(missionId, name, type, launchWindow, result) {
    return {
      missionId,
      decisionId: null,
      // Will be linked when AI makes decision
      name,
      type,
      launchWindow,
      totalDeltaV: result.totalDeltaV,
      flightTime: result.flightTime,
      fuelMass: result.fuelMass,
      efficiency: result.efficiency,
      trajectoryPoints: result.trajectoryPoints,
      orbitalElements: result.orbitalElements,
      riskFactors: result.riskFactors,
      calculations: result.calculations,
      isActive: false
    };
  }
};
function generatePatchedConicTrajectoryPoints(r_earth, r_moon, lunarSOI, numPoints) {
  const points = [];
  const totalDistance = r_moon;
  const soiTransition = r_moon - lunarSOI;
  const earthPhasePoints = Math.floor(numPoints * 0.8);
  const lunarPhasePoints = numPoints - earthPhasePoints;
  const a_earth = (r_earth + soiTransition) / 2;
  const e_earth = Math.abs(soiTransition - r_earth) / (r_earth + soiTransition);
  for (let i = 0; i <= earthPhasePoints; i++) {
    const theta = Math.PI * i / earthPhasePoints;
    const r = a_earth * (1 - e_earth * e_earth) / (1 + e_earth * Math.cos(theta));
    points.push(new Vector3D(
      r * Math.cos(theta),
      r * Math.sin(theta),
      0
    ));
  }
  const r_moon_parking = CONSTANTS.MOON_RADIUS + CONSTANTS.MOON_ORBIT_ALT;
  for (let i = 1; i <= lunarPhasePoints; i++) {
    const t = i / lunarPhasePoints;
    const r = soiTransition + t * (r_moon - soiTransition);
    const curvature = Math.sin(t * Math.PI / 2) * lunarSOI * 0.1;
    points.push(new Vector3D(
      r,
      curvature,
      0
    ));
  }
  return points;
}
function generateLambertTrajectoryPoints(r1, r2, solution, numPoints) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const point = Vector3D.add(
      Vector3D.multiply(r1, 1 - t),
      Vector3D.multiply(r2, t)
    );
    points.push(point);
  }
  return points;
}
function assessTrajectoryRisks(type, deltaV, flightTime) {
  const risks = [];
  if (deltaV > 4) {
    risks.push("High delta-V requirement increases fuel load and complexity");
  }
  if (flightTime > 120) {
    risks.push("Extended flight time increases exposure to space weather");
  }
  if (type === "lambert") {
    risks.push("Lambert solution may require precise timing and navigation");
  }
  risks.push("Monitor solar activity during launch window");
  risks.push("Debris avoidance maneuvers may be required");
  return risks;
}
function calculateEfficiency(deltaV, r1, r2) {
  const mu = CONSTANTS.MU_EARTH;
  const v1_circular = Math.sqrt(mu / r1);
  const v2_circular = Math.sqrt(mu / r2);
  const a_transfer = (r1 + r2) / 2;
  const v1_transfer = Math.sqrt(mu * (2 / r1 - 1 / a_transfer));
  const v2_transfer = Math.sqrt(mu * (2 / r2 - 1 / a_transfer));
  const theoretical_min = Math.abs(v1_transfer - v1_circular) + Math.abs(v2_circular - v2_transfer);
  return Math.max(0, Math.min(100, theoretical_min / deltaV * 100));
}

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/test", (req, res) => {
    console.log("Test route hit");
    console.log("About to send JSON response");
    res.status(200).set("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Routes are working!", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
  });
  app2.post("/api/register", async (req, res) => {
    console.log("Register endpoint hit");
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          message: "Username and password are required",
          error: "MISSING_FIELDS"
        });
      }
      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long",
          error: "WEAK_PASSWORD"
        });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          message: "Username already exists",
          error: "USERNAME_EXISTS"
        });
      }
      const newUser = await storage.createUser({ username, password });
      const { password: _, ...userResponse } = newUser;
      res.status(201).json({
        message: "User created successfully",
        user: userResponse
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Internal server error during registration",
        error: "REGISTRATION_FAILED"
      });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          message: "Username and password are required",
          error: "MISSING_FIELDS"
        });
      }
      const user = await storage.verifyPassword(username, password);
      if (!user) {
        return res.status(401).json({
          message: "Invalid username or password",
          error: "INVALID_CREDENTIALS"
        });
      }
      const { password: _, ...userResponse } = user;
      res.status(200).json({
        message: "Login successful",
        user: userResponse
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        message: "Internal server error during login",
        error: "LOGIN_FAILED"
      });
    }
  });
  app2.get("/api/me", async (req, res) => {
    res.status(501).json({
      message: "Session management not implemented yet",
      error: "NOT_IMPLEMENTED"
    });
  });
  app2.post("/api/missions/:missionId/trajectories", async (req, res) => {
    try {
      const { missionId } = req.params;
      const { name, type, launchWindow, flightTime } = req.body;
      console.log(`Planning trajectory for mission ${missionId}:`, req.body);
      const trajectoryInput = z.object({
        name: z.string().min(1, "Trajectory name is required"),
        type: z.enum(["hohmann", "lambert", "bi_elliptic", "custom"]),
        launchWindow: z.string().transform((str) => new Date(str)),
        flightTime: z.number().min(1).max(720)
        // 1 to 720 hours (30 days)
      });
      const validated = trajectoryInput.parse({ name, type, launchWindow, flightTime });
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({
          message: "Mission not found",
          error: "MISSION_NOT_FOUND"
        });
      }
      let trajectoryResult;
      if (validated.type === "custom") {
        return res.status(400).json({
          message: "Custom trajectory type is not supported by the engine",
          error: "CUSTOM_TYPE_NOT_SUPPORTED"
        });
      } else {
        trajectoryResult = TrajectoryEngine.generateEarthMoonTrajectory(
          validated.launchWindow,
          validated.type,
          validated.flightTime
        );
      }
      const trajectoryRecord = TrajectoryEngine.generateTrajectoryRecord(
        missionId,
        validated.name,
        validated.type,
        validated.launchWindow,
        trajectoryResult
      );
      const savedTrajectory = await storage.createTrajectory(trajectoryRecord);
      res.status(201).json({
        message: "Trajectory calculated successfully",
        trajectory: savedTrajectory
      });
    } catch (error) {
      console.error("Trajectory calculation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid input data",
          errors: error.errors,
          error: "VALIDATION_ERROR"
        });
      }
      res.status(500).json({
        message: "Internal server error during trajectory calculation",
        error: "CALCULATION_FAILED"
      });
    }
  });
  app2.get("/api/missions/:missionId/trajectories", async (req, res) => {
    try {
      const { missionId } = req.params;
      console.log(`Fetching trajectories for mission ${missionId}`);
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({
          message: "Mission not found",
          error: "MISSION_NOT_FOUND"
        });
      }
      const trajectories2 = await storage.getTrajectoriesByMission(missionId);
      res.status(200).json({
        message: "Trajectories retrieved successfully",
        trajectories: trajectories2,
        count: trajectories2.length
      });
    } catch (error) {
      console.error("Error fetching trajectories:", error);
      res.status(500).json({
        message: "Internal server error fetching trajectories",
        error: "FETCH_FAILED"
      });
    }
  });
  app2.get("/api/missions/:missionId/trajectories/active", async (req, res) => {
    try {
      const { missionId } = req.params;
      console.log(`Fetching active trajectory for mission ${missionId}`);
      const activeTrajectory = await storage.getActiveTrajectoryForMission(missionId);
      if (!activeTrajectory) {
        return res.status(404).json({
          message: "No active trajectory found for this mission",
          error: "NO_ACTIVE_TRAJECTORY"
        });
      }
      res.status(200).json({
        message: "Active trajectory retrieved successfully",
        trajectory: activeTrajectory
      });
    } catch (error) {
      console.error("Error fetching active trajectory:", error);
      res.status(500).json({
        message: "Internal server error fetching active trajectory",
        error: "FETCH_FAILED"
      });
    }
  });
  app2.post("/api/missions/:missionId/trajectories/:trajectoryId/activate", async (req, res) => {
    try {
      const { missionId, trajectoryId } = req.params;
      console.log(`Activating trajectory ${trajectoryId} for mission ${missionId}`);
      const trajectory = await storage.getTrajectory(trajectoryId);
      if (!trajectory || trajectory.missionId !== missionId) {
        return res.status(404).json({
          message: "Trajectory not found or does not belong to this mission",
          error: "TRAJECTORY_NOT_FOUND"
        });
      }
      const success = await storage.setActiveTrajectory(missionId, trajectoryId);
      if (!success) {
        return res.status(400).json({
          message: "Failed to activate trajectory",
          error: "ACTIVATION_FAILED"
        });
      }
      res.status(200).json({
        message: "Trajectory activated successfully",
        trajectoryId
      });
    } catch (error) {
      console.error("Error activating trajectory:", error);
      res.status(500).json({
        message: "Internal server error activating trajectory",
        error: "ACTIVATION_FAILED"
      });
    }
  });
  app2.post("/api/missions", async (req, res) => {
    try {
      const missionData = insertMissionSchema.parse(req.body);
      console.log("Creating new mission:", missionData);
      const newMission = await storage.createMission(missionData);
      res.status(201).json({
        message: "Mission created successfully",
        mission: newMission
      });
    } catch (error) {
      console.error("Mission creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid mission data",
          errors: error.errors,
          error: "VALIDATION_ERROR"
        });
      }
      res.status(500).json({
        message: "Internal server error creating mission",
        error: "CREATION_FAILED"
      });
    }
  });
  app2.get("/api/missions", async (req, res) => {
    try {
      const { active } = req.query;
      console.log("Fetching missions, active filter:", active);
      let missions2;
      if (active === "true") {
        missions2 = await storage.getActiveMissions();
      } else {
        missions2 = await storage.getAllMissions();
      }
      res.status(200).json({
        message: "Missions retrieved successfully",
        missions: missions2,
        count: missions2.length
      });
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({
        message: "Internal server error fetching missions",
        error: "FETCH_FAILED"
      });
    }
  });
  app2.get("/api/missions/:missionId", async (req, res) => {
    try {
      const { missionId } = req.params;
      console.log(`Fetching mission ${missionId}`);
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({
          message: "Mission not found",
          error: "MISSION_NOT_FOUND"
        });
      }
      res.status(200).json({
        message: "Mission retrieved successfully",
        mission
      });
    } catch (error) {
      console.error("Error fetching mission:", error);
      res.status(500).json({
        message: "Internal server error fetching mission",
        error: "FETCH_FAILED"
      });
    }
  });
  app2.put("/api/missions/:missionId", async (req, res) => {
    try {
      const { missionId } = req.params;
      const updates = req.body;
      console.log(`Updating mission ${missionId}:`, updates);
      const updatedMission = await storage.updateMission(missionId, updates);
      if (!updatedMission) {
        return res.status(404).json({
          message: "Mission not found",
          error: "MISSION_NOT_FOUND"
        });
      }
      res.status(200).json({
        message: "Mission updated successfully",
        mission: updatedMission
      });
    } catch (error) {
      console.error("Error updating mission:", error);
      res.status(500).json({
        message: "Internal server error updating mission",
        error: "UPDATE_FAILED"
      });
    }
  });
  app2.delete("/api/missions/:missionId", async (req, res) => {
    try {
      const { missionId } = req.params;
      console.log(`Deleting mission ${missionId}`);
      const success = await storage.deleteMission(missionId);
      if (!success) {
        return res.status(404).json({
          message: "Mission not found",
          error: "MISSION_NOT_FOUND"
        });
      }
      res.status(200).json({
        message: "Mission deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting mission:", error);
      res.status(500).json({
        message: "Internal server error deleting mission",
        error: "DELETE_FAILED"
      });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.status(200).json({
      message: "ODIN System API is running",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/proxy-json", async (req, res) => {
    try {
      const raw = String(req.query.url || "");
      if (!raw) return res.status(400).json({ message: "Missing url parameter" });
      const url = raw.trim();
      const normalizeDrive = (u) => {
        const m1 = u.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//);
        if (m1) return `https://drive.google.com/uc?export=download&id=${m1[1]}`;
        const m2 = u.match(/https?:\/\/drive\.google\.com\/open\?id=([^&]+)/);
        if (m2) return `https://drive.google.com/uc?export=download&id=${m2[1]}`;
        const idQ = u.match(/[?&]id=([^&]+)/);
        if (u.includes("drive.google.com") && idQ) return `https://drive.google.com/uc?export=download&id=${idQ[1]}`;
        return u;
      };
      const finalUrl = normalizeDrive(url);
      const allowed = /^https?:\/\/(drive\.google\.com|drive\.usercontent\.google\.com)\//.test(finalUrl);
      if (!allowed) return res.status(400).json({ message: "URL not allowed" });
      const upstream = await fetch(finalUrl, { redirect: "follow" });
      const text2 = await upstream.text();
      try {
        const json = JSON.parse(text2);
        res.setHeader("content-type", "application/json");
        return res.status(200).end(JSON.stringify(json));
      } catch (e) {
        return res.status(400).json({ message: "Remote content is not valid JSON", status: upstream.status, snippet: text2.slice(0, 200) });
      }
    } catch (err) {
      return res.status(500).json({ message: "Proxy error", error: err?.message || String(err) });
    }
  });
  const PY_BACKEND_URL = process.env.PY_BACKEND_URL;
  app2.all("/py/*", async (req, res) => {
    try {
      if (!PY_BACKEND_URL) {
        return res.status(500).json({ message: "PY_BACKEND_URL is not configured" });
      }
      const subPath = req.originalUrl.replace(/^\/py/, "");
      const targetUrl = `${PY_BACKEND_URL}${subPath}`;
      const isBodyAllowed = !["GET", "HEAD"].includes(req.method.toUpperCase());
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headers[k] = v;
      }
      delete headers["host"];
      const init = { method: req.method, headers };
      if (isBodyAllowed && req.body && Object.keys(req.body).length > 0) {
        headers["content-type"] = headers["content-type"] || "application/json";
        init.body = headers["content-type"].includes("application/json") ? JSON.stringify(req.body) : req.rawBody || JSON.stringify(req.body);
      }
      const upstream = await fetch(targetUrl, init);
      const contentType = upstream.headers.get("content-type") || "application/json";
      res.status(upstream.status);
      res.setHeader("content-type", contentType);
      const buf = await upstream.arrayBuffer();
      res.end(Buffer.from(buf));
    } catch (err) {
      res.status(502).json({ message: "Upstream error", error: err?.message || String(err) });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
var viteConfig = {};
try {
  viteConfig = (await Promise.resolve().then(() => (init_vite_config(), vite_config_exports))).default;
} catch {
  viteConfig = {};
}
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ..._args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
process.env.PY_BACKEND_URL = process.env.PY_BACKEND_URL || "";
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error: ${message}`);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5050", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
