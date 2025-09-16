import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TrajectoryEngine } from "./trajectory-engine";
import { insertMissionSchema, insertTrajectorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route to verify route registration
  app.get('/api/test', (req, res) => {
    console.log('Test route hit');
    console.log('About to send JSON response');
    res.status(200).set('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Routes are working!', timestamp: new Date().toISOString() }));
  });
  
  // Authentication routes
  
  // User registration
  app.post('/api/register', async (req, res) => {
    console.log('Register endpoint hit');
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required',
          error: 'MISSING_FIELDS'
        });
      }
      
      // Check password strength
      if (password.length < 8) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long',
          error: 'WEAK_PASSWORD'
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Username already exists',
          error: 'USERNAME_EXISTS'
        });
      }
      
      // Create user (password will be hashed in storage layer)
      const newUser = await storage.createUser({ username, password });
      
      // Return user without password
      const { password: _, ...userResponse } = newUser;
      res.status(201).json({ 
        message: 'User created successfully',
        user: userResponse 
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Internal server error during registration',
        error: 'REGISTRATION_FAILED'
      });
    }
  });
  
  // User login
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required',
          error: 'MISSING_FIELDS'
        });
      }
      
      // Verify credentials
      const user = await storage.verifyPassword(username, password);
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid username or password',
          error: 'INVALID_CREDENTIALS'
        });
      }
      
      // Return user without password
      const { password: _, ...userResponse } = user;
      res.status(200).json({ 
        message: 'Login successful',
        user: userResponse
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: 'Internal server error during login',
        error: 'LOGIN_FAILED'
      });
    }
  });
  
  // Get current user (if implementing session management later)
  app.get('/api/me', async (req, res) => {
    // Placeholder for session-based auth
    res.status(501).json({ 
      message: 'Session management not implemented yet',
      error: 'NOT_IMPLEMENTED'
    });
  });

  // Trajectory Planning Routes
  
  // Plan new trajectory for a mission
  app.post('/api/missions/:missionId/trajectories', async (req, res) => {
    try {
      const { missionId } = req.params;
      const { name, type, launchWindow, flightTime } = req.body;
      
      console.log(`Planning trajectory for mission ${missionId}:`, req.body);
      
      // Validate input
      const trajectoryInput = z.object({
        name: z.string().min(1, 'Trajectory name is required'),
        type: z.enum(['hohmann', 'lambert', 'bi_elliptic', 'custom']),
        launchWindow: z.string().transform(str => new Date(str)),
        flightTime: z.number().min(1).max(720) // 1 to 720 hours (30 days)
      });
      
      const validated = trajectoryInput.parse({ name, type, launchWindow, flightTime });
      
      // Check if mission exists
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({
          message: 'Mission not found',
          error: 'MISSION_NOT_FOUND'
        });
      }
      
      // Calculate trajectory using the engine
      const trajectoryResult = TrajectoryEngine.generateEarthMoonTrajectory(
        validated.launchWindow,
        validated.type,
        validated.flightTime
      );
      
      // Create trajectory record
      const trajectoryRecord = TrajectoryEngine.generateTrajectoryRecord(
        missionId,
        validated.name,
        validated.type,
        validated.launchWindow,
        trajectoryResult
      );
      
      // Save to database
      const savedTrajectory = await storage.createTrajectory(trajectoryRecord);
      
      res.status(201).json({
        message: 'Trajectory calculated successfully',
        trajectory: savedTrajectory
      });
      
    } catch (error) {
      console.error('Trajectory calculation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid input data',
          errors: error.errors,
          error: 'VALIDATION_ERROR'
        });
      }
      
      res.status(500).json({
        message: 'Internal server error during trajectory calculation',
        error: 'CALCULATION_FAILED'
      });
    }
  });
  
  // Get all trajectories for a mission
  app.get('/api/missions/:missionId/trajectories', async (req, res) => {
    try {
      const { missionId } = req.params;
      
      console.log(`Fetching trajectories for mission ${missionId}`);
      
      // Check if mission exists
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({
          message: 'Mission not found',
          error: 'MISSION_NOT_FOUND'
        });
      }
      
      const trajectories = await storage.getTrajectoriesByMission(missionId);
      
      res.status(200).json({
        message: 'Trajectories retrieved successfully',
        trajectories,
        count: trajectories.length
      });
      
    } catch (error) {
      console.error('Error fetching trajectories:', error);
      res.status(500).json({
        message: 'Internal server error fetching trajectories',
        error: 'FETCH_FAILED'
      });
    }
  });
  
  // Get active trajectory for a mission
  app.get('/api/missions/:missionId/trajectories/active', async (req, res) => {
    try {
      const { missionId } = req.params;
      
      console.log(`Fetching active trajectory for mission ${missionId}`);
      
      const activeTrajectory = await storage.getActiveTrajectoryForMission(missionId);
      
      if (!activeTrajectory) {
        return res.status(404).json({
          message: 'No active trajectory found for this mission',
          error: 'NO_ACTIVE_TRAJECTORY'
        });
      }
      
      res.status(200).json({
        message: 'Active trajectory retrieved successfully',
        trajectory: activeTrajectory
      });
      
    } catch (error) {
      console.error('Error fetching active trajectory:', error);
      res.status(500).json({
        message: 'Internal server error fetching active trajectory',
        error: 'FETCH_FAILED'
      });
    }
  });
  
  // Set active trajectory for a mission
  app.post('/api/missions/:missionId/trajectories/:trajectoryId/activate', async (req, res) => {
    try {
      const { missionId, trajectoryId } = req.params;
      
      console.log(`Activating trajectory ${trajectoryId} for mission ${missionId}`);
      
      // Verify trajectory belongs to mission
      const trajectory = await storage.getTrajectory(trajectoryId);
      if (!trajectory || trajectory.missionId !== missionId) {
        return res.status(404).json({
          message: 'Trajectory not found or does not belong to this mission',
          error: 'TRAJECTORY_NOT_FOUND'
        });
      }
      
      const success = await storage.setActiveTrajectory(missionId, trajectoryId);
      
      if (!success) {
        return res.status(400).json({
          message: 'Failed to activate trajectory',
          error: 'ACTIVATION_FAILED'
        });
      }
      
      res.status(200).json({
        message: 'Trajectory activated successfully',
        trajectoryId
      });
      
    } catch (error) {
      console.error('Error activating trajectory:', error);
      res.status(500).json({
        message: 'Internal server error activating trajectory',
        error: 'ACTIVATION_FAILED'
      });
    }
  });
  
  // Mission Management Routes
  
  // Create new mission
  app.post('/api/missions', async (req, res) => {
    try {
      const missionData = insertMissionSchema.parse(req.body);
      
      console.log('Creating new mission:', missionData);
      
      const newMission = await storage.createMission(missionData);
      
      res.status(201).json({
        message: 'Mission created successfully',
        mission: newMission
      });
      
    } catch (error) {
      console.error('Mission creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid mission data',
          errors: error.errors,
          error: 'VALIDATION_ERROR'
        });
      }
      
      res.status(500).json({
        message: 'Internal server error creating mission',
        error: 'CREATION_FAILED'
      });
    }
  });
  
  // Get all missions
  app.get('/api/missions', async (req, res) => {
    try {
      const { active } = req.query;
      
      console.log('Fetching missions, active filter:', active);
      
      let missions;
      if (active === 'true') {
        missions = await storage.getActiveMissions();
      } else {
        missions = await storage.getAllMissions();
      }
      
      res.status(200).json({
        message: 'Missions retrieved successfully',
        missions,
        count: missions.length
      });
      
    } catch (error) {
      console.error('Error fetching missions:', error);
      res.status(500).json({
        message: 'Internal server error fetching missions',
        error: 'FETCH_FAILED'
      });
    }
  });
  
  // Get mission by ID
  app.get('/api/missions/:missionId', async (req, res) => {
    try {
      const { missionId } = req.params;
      
      console.log(`Fetching mission ${missionId}`);
      
      const mission = await storage.getMission(missionId);
      
      if (!mission) {
        return res.status(404).json({
          message: 'Mission not found',
          error: 'MISSION_NOT_FOUND'
        });
      }
      
      res.status(200).json({
        message: 'Mission retrieved successfully',
        mission
      });
      
    } catch (error) {
      console.error('Error fetching mission:', error);
      res.status(500).json({
        message: 'Internal server error fetching mission',
        error: 'FETCH_FAILED'
      });
    }
  });
  
  // Update mission
  app.put('/api/missions/:missionId', async (req, res) => {
    try {
      const { missionId } = req.params;
      const updates = req.body;
      
      console.log(`Updating mission ${missionId}:`, updates);
      
      const updatedMission = await storage.updateMission(missionId, updates);
      
      if (!updatedMission) {
        return res.status(404).json({
          message: 'Mission not found',
          error: 'MISSION_NOT_FOUND'
        });
      }
      
      res.status(200).json({
        message: 'Mission updated successfully',
        mission: updatedMission
      });
      
    } catch (error) {
      console.error('Error updating mission:', error);
      res.status(500).json({
        message: 'Internal server error updating mission',
        error: 'UPDATE_FAILED'
      });
    }
  });
  
  // Delete mission
  app.delete('/api/missions/:missionId', async (req, res) => {
    try {
      const { missionId } = req.params;
      
      console.log(`Deleting mission ${missionId}`);
      
      const success = await storage.deleteMission(missionId);
      
      if (!success) {
        return res.status(404).json({
          message: 'Mission not found',
          error: 'MISSION_NOT_FOUND'
        });
      }
      
      res.status(200).json({
        message: 'Mission deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting mission:', error);
      res.status(500).json({
        message: 'Internal server error deleting mission',
        error: 'DELETE_FAILED'
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      message: 'ODIN System API is running',
      timestamp: new Date().toISOString()
    });
  });

  // Lightweight JSON fetch proxy for approved hosts (to bypass CORS)
  app.get('/api/proxy-json', async (req, res) => {
    try {
      const raw = String(req.query.url || '')
      if (!raw) return res.status(400).json({ message: 'Missing url parameter' })
      const url = raw.trim()

      const normalizeDrive = (u: string) => {
        const m1 = u.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//)
        if (m1) return `https://drive.google.com/uc?export=download&id=${m1[1]}`
        const m2 = u.match(/https?:\/\/drive\.google\.com\/open\?id=([^&]+)/)
        if (m2) return `https://drive.google.com/uc?export=download&id=${m2[1]}`
        const idQ = u.match(/[?&]id=([^&]+)/)
        if (u.includes('drive.google.com') && idQ) return `https://drive.google.com/uc?export=download&id=${idQ[1]}`
        return u
      }

      const finalUrl = normalizeDrive(url)
      const allowed = /^https?:\/\/(drive\.google\.com|drive\.usercontent\.google\.com)\//.test(finalUrl)
      if (!allowed) return res.status(400).json({ message: 'URL not allowed' })

      const upstream = await fetch(finalUrl, { redirect: 'follow' })
      const text = await upstream.text()
      try {
        const json = JSON.parse(text)
        res.setHeader('content-type', 'application/json')
        return res.status(200).end(JSON.stringify(json))
      } catch (e) {
        return res.status(400).json({ message: 'Remote content is not valid JSON', status: upstream.status, snippet: text.slice(0, 200) })
      }
    } catch (err: any) {
      return res.status(500).json({ message: 'Proxy error', error: err?.message || String(err) })
    }
  })

  // Proxy to external Python backend to avoid CORS issues
  const PY_BACKEND_URL = process.env.PY_BACKEND_URL;
  app.all('/py/*', async (req, res) => {
    try {
      if (!PY_BACKEND_URL) {
        return res.status(500).json({ message: 'PY_BACKEND_URL is not configured' });
      }
      const subPath = req.originalUrl.replace(/^\/py/, '');
      const targetUrl = `${PY_BACKEND_URL}${subPath}`;

      const isBodyAllowed = !['GET', 'HEAD'].includes(req.method.toUpperCase());
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headers[k] = v;
      }
      delete headers['host'];

      const init: RequestInit = { method: req.method, headers };
      if (isBodyAllowed && req.body && Object.keys(req.body).length > 0) {
        headers['content-type'] = headers['content-type'] || 'application/json';
        init.body = headers['content-type'].includes('application/json')
          ? JSON.stringify(req.body)
          : (req as any).rawBody || JSON.stringify(req.body);
      }

      const upstream = await fetch(targetUrl, init);
      const contentType = upstream.headers.get('content-type') || 'application/json';
      res.status(upstream.status);
      res.setHeader('content-type', contentType);
      const buf = await upstream.arrayBuffer();
      res.end(Buffer.from(buf));
    } catch (err: any) {
      res.status(502).json({ message: 'Upstream error', error: err?.message || String(err) });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
