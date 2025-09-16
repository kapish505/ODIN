import { 
  type User, 
  type InsertUser,
  type Mission,
  type InsertMission,
  type SpaceWeather,
  type InsertSpaceWeather,
  type ThreatEvent,
  type InsertThreatEvent,
  type AiDecision,
  type InsertAiDecision,
  type Trajectory,
  type InsertTrajectory,
  users,
  missions,
  spaceWeather,
  threatEvents,
  aiDecisions,
  trajectories
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";

// ODIN System Storage Interface
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(username: string, password: string): Promise<User | null>;

  // Missions
  getMission(id: string): Promise<Mission | undefined>;
  getMissionByMissionId(missionId: string): Promise<Mission | undefined>;
  getAllMissions(): Promise<Mission[]>;
  getActiveMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined>;
  deleteMission(id: string): Promise<boolean>;

  // Space Weather Data
  getSpaceWeatherByTimeRange(startTime: Date, endTime: Date): Promise<SpaceWeather[]>;
  getLatestSpaceWeather(): Promise<SpaceWeather | undefined>;
  createSpaceWeather(data: InsertSpaceWeather): Promise<SpaceWeather>;

  // Threat Events
  getThreatEvent(id: string): Promise<ThreatEvent | undefined>;
  getThreatEventsByMission(missionId: string): Promise<ThreatEvent[]>;
  getActiveThreatEvents(): Promise<ThreatEvent[]>;
  createThreatEvent(event: InsertThreatEvent): Promise<ThreatEvent>;
  updateThreatEvent(id: string, updates: Partial<ThreatEvent>): Promise<ThreatEvent | undefined>;
  resolveThreatEvent(id: string): Promise<boolean>;

  // AI Decisions
  getAiDecision(id: string): Promise<AiDecision | undefined>;
  getAiDecisionsByMission(missionId: string): Promise<AiDecision[]>;
  getAllAiDecisions(): Promise<AiDecision[]>;
  createAiDecision(decision: InsertAiDecision): Promise<AiDecision>;
  updateAiDecision(id: string, updates: Partial<AiDecision>): Promise<AiDecision | undefined>;

  // Trajectories
  getTrajectory(id: string): Promise<Trajectory | undefined>;
  getTrajectoriesByMission(missionId: string): Promise<Trajectory[]>;
  getActiveTrajectoryForMission(missionId: string): Promise<Trajectory | undefined>;
  createTrajectory(trajectory: InsertTrajectory): Promise<Trajectory>;
  updateTrajectory(id: string, updates: Partial<Trajectory>): Promise<Trajectory | undefined>;
  setActiveTrajectory(missionId: string, trajectoryId: string): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword
    };
    
    const result = await db.insert(users).values(userWithHashedPassword).returning();
    return result[0];
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Missions
  async getMission(id: string): Promise<Mission | undefined> {
    const result = await db.select().from(missions).where(eq(missions.id, id)).limit(1);
    return result[0];
  }

  async getMissionByMissionId(missionId: string): Promise<Mission | undefined> {
    const result = await db.select().from(missions).where(eq(missions.missionId, missionId)).limit(1);
    return result[0];
  }

  async getAllMissions(): Promise<Mission[]> {
    return await db.select().from(missions).orderBy(desc(missions.createdAt));
  }

  async getActiveMissions(): Promise<Mission[]> {
    return await db.select().from(missions)
      .where(or(eq(missions.status, "active"), eq(missions.status, "planning")))
      .orderBy(desc(missions.createdAt));
  }

  async createMission(mission: InsertMission): Promise<Mission> {
    const result = await db.insert(missions).values(mission).returning();
    return result[0];
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined> {
    const result = await db.update(missions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    return result[0];
  }

  async deleteMission(id: string): Promise<boolean> {
    const result = await db.delete(missions).where(eq(missions.id, id)).returning();
    return result.length > 0;
  }

  // Space Weather Data
  async getSpaceWeatherByTimeRange(startTime: Date, endTime: Date): Promise<SpaceWeather[]> {
    return await db.select().from(spaceWeather)
      .where(and(
        gte(spaceWeather.timestamp, startTime),
        lte(spaceWeather.timestamp, endTime)
      ))
      .orderBy(desc(spaceWeather.timestamp));
  }

  async getLatestSpaceWeather(): Promise<SpaceWeather | undefined> {
    const result = await db.select().from(spaceWeather)
      .orderBy(desc(spaceWeather.timestamp))
      .limit(1);
    return result[0];
  }

  async createSpaceWeather(data: InsertSpaceWeather): Promise<SpaceWeather> {
    const result = await db.insert(spaceWeather).values(data).returning();
    return result[0];
  }

  // Threat Events
  async getThreatEvent(id: string): Promise<ThreatEvent | undefined> {
    const result = await db.select().from(threatEvents).where(eq(threatEvents.id, id)).limit(1);
    return result[0];
  }

  async getThreatEventsByMission(missionId: string): Promise<ThreatEvent[]> {
    return await db.select().from(threatEvents)
      .where(eq(threatEvents.missionId, missionId))
      .orderBy(desc(threatEvents.detectedAt));
  }

  async getActiveThreatEvents(): Promise<ThreatEvent[]> {
    return await db.select().from(threatEvents)
      .where(eq(threatEvents.status, "active"))
      .orderBy(desc(threatEvents.detectedAt));
  }

  async createThreatEvent(event: InsertThreatEvent): Promise<ThreatEvent> {
    const result = await db.insert(threatEvents).values(event).returning();
    return result[0];
  }

  async updateThreatEvent(id: string, updates: Partial<ThreatEvent>): Promise<ThreatEvent | undefined> {
    const result = await db.update(threatEvents)
      .set(updates)
      .where(eq(threatEvents.id, id))
      .returning();
    return result[0];
  }

  async resolveThreatEvent(id: string): Promise<boolean> {
    const result = await db.update(threatEvents)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(threatEvents.id, id))
      .returning();
    return result.length > 0;
  }

  // AI Decisions
  async getAiDecision(id: string): Promise<AiDecision | undefined> {
    const result = await db.select().from(aiDecisions).where(eq(aiDecisions.id, id)).limit(1);
    return result[0];
  }

  async getAiDecisionsByMission(missionId: string): Promise<AiDecision[]> {
    return await db.select().from(aiDecisions)
      .where(eq(aiDecisions.missionId, missionId))
      .orderBy(desc(aiDecisions.timestamp));
  }

  async getAllAiDecisions(): Promise<AiDecision[]> {
    return await db.select().from(aiDecisions).orderBy(desc(aiDecisions.timestamp));
  }

  async createAiDecision(decision: InsertAiDecision): Promise<AiDecision> {
    const result = await db.insert(aiDecisions).values(decision).returning();
    return result[0];
  }

  async updateAiDecision(id: string, updates: Partial<AiDecision>): Promise<AiDecision | undefined> {
    const result = await db.update(aiDecisions)
      .set(updates)
      .where(eq(aiDecisions.id, id))
      .returning();
    return result[0];
  }

  // Trajectories
  async getTrajectory(id: string): Promise<Trajectory | undefined> {
    const result = await db.select().from(trajectories).where(eq(trajectories.id, id)).limit(1);
    return result[0];
  }

  async getTrajectoriesByMission(missionId: string): Promise<Trajectory[]> {
    return await db.select().from(trajectories)
      .where(eq(trajectories.missionId, missionId))
      .orderBy(desc(trajectories.createdAt));
  }

  async getActiveTrajectoryForMission(missionId: string): Promise<Trajectory | undefined> {
    const result = await db.select().from(trajectories)
      .where(and(
        eq(trajectories.missionId, missionId),
        eq(trajectories.isActive, true)
      ))
      .limit(1);
    return result[0];
  }

  async createTrajectory(trajectory: InsertTrajectory): Promise<Trajectory> {
    const result = await db.insert(trajectories).values(trajectory).returning();
    return result[0];
  }

  async updateTrajectory(id: string, updates: Partial<Trajectory>): Promise<Trajectory | undefined> {
    const result = await db.update(trajectories)
      .set(updates)
      .where(eq(trajectories.id, id))
      .returning();
    return result[0];
  }

  async setActiveTrajectory(missionId: string, trajectoryId: string): Promise<boolean> {
    // Use transaction to prevent race conditions
    const result = await db.transaction(async (tx) => {
      // First, deactivate all trajectories for this mission
      await tx.update(trajectories)
        .set({ isActive: false })
        .where(eq(trajectories.missionId, missionId));
      
      // Then activate the selected trajectory
      const updateResult = await tx.update(trajectories)
        .set({ isActive: true })
        .where(and(
          eq(trajectories.id, trajectoryId),
          eq(trajectories.missionId, missionId)
        ))
        .returning();
      
      return updateResult.length > 0;
    });
    
    return result;
  }
}

// Simple in-memory fallback storage (non-persistent)
class InMemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private missions = new Map<string, Mission>();
  private spaceWeather = new Map<string, SpaceWeather>();
  private threatEvents = new Map<string, ThreatEvent>();
  private aiDecisions = new Map<string, AiDecision>();
  private trajectories = new Map<string, Trajectory>();

  private nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

  private genId(): string { return this.nano(); }

  // Users
  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const u of this.users.values()) if (u.username === username) return u;
    return undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    const newUser: User = { id: this.genId(), username: user.username, password: hashedPassword } as User;
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  }

  // Missions
  async getMission(id: string): Promise<Mission | undefined> { return this.missions.get(id); }
  async getMissionByMissionId(missionId: string): Promise<Mission | undefined> {
    for (const m of this.missions.values()) if (m.missionId === missionId) return m;
    return undefined;
  }
  async getAllMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values()).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  }
  async getActiveMissions(): Promise<Mission[]> {
    return (await this.getAllMissions()).filter(m => m.status === 'active' || m.status === 'planning');
  }
  async createMission(mission: InsertMission): Promise<Mission> {
    const now = new Date();
    const m: Mission = {
      id: this.genId(),
      createdAt: now as any,
      updatedAt: now as any,
      threatLevel: 'low',
      currentProgress: 0 as any,
      threatEvents: mission.threatEvents as any,
      trajectoryData: mission.trajectoryData as any,
      name: mission.name,
      missionId: mission.missionId,
      status: mission.status ?? 'planning',
      launchDate: mission.launchDate as any,
      arrivalDate: mission.arrivalDate as any,
    } as Mission;
    this.missions.set(m.id, m);
    return m;
  }
  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined> {
    const existing = this.missions.get(id); if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() } as Mission;
    this.missions.set(id, updated);
    return updated;
  }
  async deleteMission(id: string): Promise<boolean> { return this.missions.delete(id); }

  // Space Weather
  async getSpaceWeatherByTimeRange(startTime: Date, endTime: Date): Promise<SpaceWeather[]> {
    return Array.from(this.spaceWeather.values())
      .filter(s => s.timestamp >= startTime && s.timestamp <= endTime)
      .sort((a, b) => (b.timestamp as any) - (a.timestamp as any));
  }
  async getLatestSpaceWeather(): Promise<SpaceWeather | undefined> {
    return (await this.getSpaceWeatherByTimeRange(new Date(0), new Date()))[0];
  }
  async createSpaceWeather(data: InsertSpaceWeather): Promise<SpaceWeather> {
    const rec: SpaceWeather = { id: this.genId(), createdAt: new Date() as any, ...data } as SpaceWeather;
    this.spaceWeather.set(rec.id, rec);
    return rec;
  }

  // Threat Events
  async getThreatEvent(id: string): Promise<ThreatEvent | undefined> { return this.threatEvents.get(id); }
  async getThreatEventsByMission(missionId: string): Promise<ThreatEvent[]> {
    return Array.from(this.threatEvents.values()).filter(t => t.missionId === missionId)
      .sort((a, b) => (b.detectedAt?.getTime?.() || 0) - (a.detectedAt?.getTime?.() || 0));
  }
  async getActiveThreatEvents(): Promise<ThreatEvent[]> {
    return Array.from(this.threatEvents.values()).filter(t => t.status === 'active')
      .sort((a, b) => (b.detectedAt?.getTime?.() || 0) - (a.detectedAt?.getTime?.() || 0));
  }
  async createThreatEvent(event: InsertThreatEvent): Promise<ThreatEvent> {
    const rec: ThreatEvent = { id: this.genId(), status: 'active' as any, detectedAt: new Date() as any, ...event } as ThreatEvent;
    this.threatEvents.set(rec.id, rec);
    return rec;
  }
  async updateThreatEvent(id: string, updates: Partial<ThreatEvent>): Promise<ThreatEvent | undefined> {
    const existing = this.threatEvents.get(id); if (!existing) return undefined;
    const updated = { ...existing, ...updates } as ThreatEvent;
    this.threatEvents.set(id, updated);
    return updated;
  }
  async resolveThreatEvent(id: string): Promise<boolean> {
    const existing = this.threatEvents.get(id); if (!existing) return false;
    existing.status = 'resolved' as any;
    existing.resolvedAt = new Date() as any;
    this.threatEvents.set(id, existing);
    return true;
  }

  // AI Decisions
  async getAiDecision(id: string): Promise<AiDecision | undefined> { return this.aiDecisions.get(id); }
  async getAiDecisionsByMission(missionId: string): Promise<AiDecision[]> {
    return Array.from(this.aiDecisions.values()).filter(d => d.missionId === missionId)
      .sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
  }
  async getAllAiDecisions(): Promise<AiDecision[]> {
    return Array.from(this.aiDecisions.values()).sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
  }
  async createAiDecision(decision: InsertAiDecision): Promise<AiDecision> {
    const rec: AiDecision = { id: this.genId(), timestamp: new Date() as any, ...decision } as AiDecision;
    this.aiDecisions.set(rec.id, rec);
    return rec;
  }
  async updateAiDecision(id: string, updates: Partial<AiDecision>): Promise<AiDecision | undefined> {
    const existing = this.aiDecisions.get(id); if (!existing) return undefined;
    const updated = { ...existing, ...updates } as AiDecision;
    this.aiDecisions.set(id, updated);
    return updated;
  }

  // Trajectories
  async getTrajectory(id: string): Promise<Trajectory | undefined> { return this.trajectories.get(id); }
  async getTrajectoriesByMission(missionId: string): Promise<Trajectory[]> {
    return Array.from(this.trajectories.values()).filter(t => t.missionId === missionId)
      .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  }
  async getActiveTrajectoryForMission(missionId: string): Promise<Trajectory | undefined> {
    return Array.from(this.trajectories.values()).find(t => t.missionId === missionId && t.isActive === true);
  }
  async createTrajectory(trajectory: InsertTrajectory): Promise<Trajectory> {
    const rec: Trajectory = { id: this.genId(), createdAt: new Date() as any, isActive: false as any, ...trajectory } as Trajectory;
    this.trajectories.set(rec.id, rec);
    return rec;
  }
  async updateTrajectory(id: string, updates: Partial<Trajectory>): Promise<Trajectory | undefined> {
    const existing = this.trajectories.get(id); if (!existing) return undefined;
    const updated = { ...existing, ...updates } as Trajectory;
    this.trajectories.set(id, updated);
    return updated;
  }
  async setActiveTrajectory(missionId: string, trajectoryId: string): Promise<boolean> {
    let changed = false;
    for (const t of this.trajectories.values()) {
      if (t.missionId === missionId) {
        if (t.id === trajectoryId) { t.isActive = true as any; changed = true; }
        else { t.isActive = false as any; }
      }
    }
    return changed;
  }
}

export const storage: IStorage = process.env.DATABASE_URL ? new PostgresStorage() : new InMemoryStorage();
