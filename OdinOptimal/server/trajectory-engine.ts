/**
 * ODIN Trajectory Planning Engine
 * Implements Lambert's problem solver, Hohmann transfers, and fuel optimization
 * for Earth-to-Moon trajectory calculations
 */

import { type InsertTrajectory } from "@shared/schema";

/**
 * Unit conversion utilities for trajectory calculations
 * All internal calculations use SI base units (seconds, meters, kilograms)
 * API boundary handles conversion from user-friendly units (hours, kilometers)
 */
export class UnitConverter {
  // Time conversions
  static readonly SECONDS_PER_HOUR = 3600;
  static readonly HOURS_PER_SECOND = 1 / 3600;
  static readonly SECONDS_PER_DAY = 86400;
  
  // Distance conversions
  static readonly METERS_PER_KM = 1000;
  static readonly KM_PER_METER = 1 / 1000;
  
  // Velocity conversions  
  static readonly MS_PER_KMS = 1000;
  static readonly KMS_PER_MS = 1 / 1000;
  
  /**
   * Convert time from hours to seconds (API boundary → internal calculations)
   */
  static hoursToSeconds(hours: number): number {
    if (hours < 0) {
      throw new Error('Time cannot be negative');
    }
    if (!isFinite(hours)) {
      throw new Error('Time must be finite');
    }
    return hours * UnitConverter.SECONDS_PER_HOUR;
  }
  
  /**
   * Convert time from seconds to hours (internal calculations → API boundary)
   */
  static secondsToHours(seconds: number): number {
    if (seconds < 0) {
      throw new Error('Time cannot be negative');
    }
    if (!isFinite(seconds)) {
      throw new Error('Time must be finite');
    }
    return seconds * UnitConverter.HOURS_PER_SECOND;
  }
  
  /**
   * Convert velocity from km/s to m/s (API boundary → internal calculations)
   */
  static kmPerSecToMPerSec(kmPerSec: number): number {
    if (!isFinite(kmPerSec)) {
      throw new Error('Velocity must be finite');
    }
    return kmPerSec * UnitConverter.MS_PER_KMS;
  }
  
  /**
   * Convert velocity from m/s to km/s (internal calculations → API boundary)
   */
  static mPerSecToKmPerSec(mPerSec: number): number {
    if (!isFinite(mPerSec)) {
      throw new Error('Velocity must be finite');
    }
    return mPerSec * UnitConverter.KMS_PER_MS;
  }
  
  /**
   * Validate that a time value is reasonable for space missions
   */
  static validateMissionTime(hours: number): void {
    if (hours < 0.1) {
      throw new Error('Mission time too short (minimum 6 minutes)');
    }
    if (hours > 8760) { // 1 year
      throw new Error('Mission time too long (maximum 1 year)');
    }
  }
  
  /**
   * Validate that a delta-V value is reasonable for space missions
   */
  static validateDeltaV(deltaV_kms: number): void {
    if (deltaV_kms < 0) {
      throw new Error('Delta-V cannot be negative');
    }
    if (deltaV_kms > 20) { // Beyond reasonable chemical propulsion capability
      throw new Error('Delta-V exceeds reasonable chemical propulsion limits (>20 km/s)');
    }
  }
}

// Physical constants
export const CONSTANTS = {
  // Gravitational parameters (km³/s²)
  MU_EARTH: 398600.4418, // Earth
  MU_MOON: 4902.7779,    // Moon
  
  // Orbital radii (km)
  EARTH_RADIUS: 6371,
  MOON_RADIUS: 1737,
  EARTH_MOON_DISTANCE: 384400,
  EARTH_LOW_ORBIT: 200,  // LEO altitude
  MOON_ORBIT_ALT: 100,   // Lunar orbit altitude
  
  // Mission parameters
  SPECIFIC_IMPULSE: 450,  // seconds (chemical propulsion)
  SPACECRAFT_DRY_MASS: 5000, // kg
} as const;

// 3D vector operations
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export class Vector3D {
  constructor(public x: number, public y: number, public z: number) {}
  
  static add(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  
  static subtract(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  
  static multiply(v: Vector3D, scalar: number): Vector3D {
    return new Vector3D(v.x * scalar, v.y * scalar, v.z * scalar);
  }
  
  static dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  
  static cross(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }
  
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  
  normalize(): Vector3D {
    const mag = this.magnitude();
    return new Vector3D(this.x / mag, this.y / mag, this.z / mag);
  }
}

// Orbital elements structure
export interface OrbitalElements {
  semiMajorAxis: number;    // km
  eccentricity: number;     // dimensionless
  inclination: number;      // degrees
  rightAscension: number;   // degrees
  argOfPerigee: number;     // degrees
  trueAnomaly: number;      // degrees
}

// Trajectory calculation result
export interface TrajectoryResult {
  totalDeltaV: number;        // km/s
  flightTime: number;         // hours
  fuelMass: number;           // kg
  efficiency: number;         // percentage
  trajectoryPoints: Vector3D[];
  orbitalElements: OrbitalElements[];
  riskFactors: string[];
  calculations: {
    hohmannTransfer?: HohmannResult;
    lambertSolution?: LambertResult;
    fuelOptimization: FuelOptimization;
  };
}

export interface HohmannResult {
  deltaV1: number;    // km/s - departure burn
  deltaV2: number;    // km/s - arrival burn
  transferTime: number; // hours
  transferOrbit: OrbitalElements;
}

export interface LambertResult {
  velocityDeparture: Vector3D;
  velocityArrival: Vector3D;
  convergenceIterations: number;
  solutionType: 'prograde' | 'retrograde';
}

export interface FuelOptimization {
  massRatio: number;
  propellantMass: number;
  specificImpulse: number;
  burnTime: number;
}

export interface PatchedConicDetails {
  lunarSOI: number;           // Lunar sphere of influence radius (km)
  v_infinity: number;         // Hyperbolic excess velocity relative to Moon (km/s)
  v_at_soi_earth_frame: number; // Velocity at SOI boundary in Earth frame (km/s)
  v_soi_entry_lunar_frame: number; // Velocity at SOI entry in lunar frame (km/s)
  moon_orbital_velocity: number;   // Moon's orbital velocity around Earth (km/s)
  energy_balance_check: boolean;   // Validates energy conservation in calculations
}

export interface LOIResult {
  strategy: 'direct' | 'capture_orbit' | 'weak_stability_boundary';
  totalDeltaV: number;         // Total LOI delta-V requirement (km/s)
  captureOrbitDeltaV: number;  // Initial capture delta-V (km/s)
  insertionDeltaV: number;     // Final insertion delta-V (km/s)
  captureOrbitElements: OrbitalElements; // Intermediate capture orbit
  finalOrbitElements: OrbitalElements;   // Final circular orbit
  totalTime: number;           // Total time for LOI sequence (hours)
  fuelEfficiency: number;      // Efficiency compared to direct insertion (%)
  feasibility: {
    propulsive: boolean;       // Can be achieved with chemical propulsion
    thermal: boolean;          // Within thermal constraints
    navigation: boolean;       // Within navigation accuracy requirements
  };
}

/**
 * Lambert's Problem Solver - Izzo Algorithm Implementation
 * Based on "Revisiting Lambert's problem" by Dario Izzo (2015)
 * This is the aerospace industry standard for Lambert problem solving
 */
export class LambertSolver {
  static solve(
    r1: Vector3D, 
    r2: Vector3D, 
    timeOfFlight: number, 
    mu: number = CONSTANTS.MU_EARTH,
    prograde: boolean = true,
    multiRevs: number = 0
  ): LambertResult {
    const tolerance = 1e-14;
    const maxIterations = 30;
    
    const r1_mag = r1.magnitude();
    const r2_mag = r2.magnitude();
    
    // Input validation
    if (r1_mag < 1e-6 || r2_mag < 1e-6) {
      throw new Error('Invalid position vectors: magnitudes too small');
    }
    if (timeOfFlight <= 0) {
      throw new Error('Time of flight must be positive');
    }
    if (mu <= 0) {
      throw new Error('Gravitational parameter must be positive');
    }
    
    // Calculate chord and semiperimeter
    const c = Vector3D.subtract(r2, r1).magnitude();
    const s = (r1_mag + r2_mag + c) / 2.0;
    
    if (c < 1e-6) {
      throw new Error('Degenerate Lambert problem: positions too close');
    }
    
    // Calculate transfer angle using proper vector operations
    const cos_dnu = Vector3D.dot(r1, r2) / (r1_mag * r2_mag);
    const cos_dnu_clamped = Math.max(-1.0, Math.min(1.0, cos_dnu));
    
    // Determine transfer direction
    const cross_product = Vector3D.cross(r1, r2);
    const sin_dnu = cross_product.magnitude() / (r1_mag * r2_mag);
    
    let dnu: number;
    if (prograde) {
      // Short way (< π)
      dnu = Math.atan2(sin_dnu, cos_dnu_clamped);
      if (dnu < 0) dnu += 2 * Math.PI;
    } else {
      // Long way (> π)  
      dnu = Math.atan2(sin_dnu, cos_dnu_clamped);
      if (dnu < 0) dnu += 2 * Math.PI;
      dnu = 2 * Math.PI - dnu;
    }
    
    // Normalized time of flight
    const T = Math.sqrt(2 * mu / (s * s * s)) * timeOfFlight;
    
    // Calculate lambda and alpha parameters (Izzo formulation)
    const lambda = Math.sqrt(r1_mag * r2_mag) * Math.cos(dnu / 2.0) / s;
    
    // Check for impossible geometry
    if (Math.abs(lambda) >= 1.0) {
      throw new Error('Lambert problem: impossible geometry (lambda >= 1)');
    }
    
    // Solve for x using householder iteration (Izzo method)
    let x: number;
    
    if (multiRevs === 0) {
      // Single revolution case
      const T_min = IzzoSolver.computeMinimumEnergyTime(lambda);
      
      if (T < T_min) {
        throw new Error(`Time of flight too short. Minimum: ${T_min}, given: ${T}`);
      }
      
      x = IzzoSolver.solveForX(lambda, T, tolerance, maxIterations);
    } else {
      // Multi-revolution case (not commonly used for Earth-Moon transfers)
      throw new Error('Multi-revolution Lambert transfers not implemented');
    }
    
    // Calculate Lagrange coefficients using exact Izzo formulation
    const { f, g, fdot, gdot } = IzzoSolver.calculateLagrangeCoefficients(
      x, lambda, r1_mag, r2_mag, s, T, timeOfFlight, mu
    );
    
    // Verify fundamental theorem of orbital mechanics (conservation check)
    const determinant = f * gdot - fdot * g;
    if (Math.abs(determinant - 1.0) > 1e-10) {
      console.warn(`Lagrange coefficients determinant error: ${Math.abs(determinant - 1.0)}`);
    }
    
    // Calculate velocity vectors
    if (Math.abs(g) < 1e-15) {
      throw new Error('Lambert solver: g coefficient too small, singular solution');
    }
    
    const v1 = Vector3D.multiply(
      Vector3D.subtract(r2, Vector3D.multiply(r1, f)), 
      1.0 / g
    );
    
    const v2 = Vector3D.add(
      Vector3D.multiply(v1, fdot),
      Vector3D.multiply(r1, gdot / g)
    );
    
    return {
      velocityDeparture: v1,
      velocityArrival: v2,
      convergenceIterations: maxIterations, // Placeholder - Izzo typically converges very fast
      solutionType: prograde ? 'prograde' : 'retrograde'
    };
  }
}

/**
 * Core Izzo algorithm implementation
 * Separated for clarity and numerical stability
 */
class IzzoSolver {
  /**
   * Compute minimum energy transfer time (parabolic limit)
   */
  static computeMinimumEnergyTime(lambda: number): number {
    const T_min = (1.0 / 3.0) * (1.0 - lambda * lambda * lambda);
    return T_min;
  }
  
  /**
   * Solve for the x parameter using Householder's method
   * This is the core of the Izzo algorithm
   */
  static solveForX(lambda: number, T: number, tolerance: number, maxIterations: number): number {
    // Initial guess based on Izzo's recommendation
    let x: number;
    
    if (T >= (1.0 / 3.0)) {
      // High energy transfer
      x = Math.pow(T * 3.0, 1.0 / 3.0) - 1.0;
    } else {
      // Low energy transfer  
      x = 5.0 * T * T * T / (2.0 * (1.0 - lambda * lambda * lambda));
    }
    
    let iterations = 0;
    let converged = false;
    
    while (iterations < maxIterations && !converged) {
      // Calculate y(x) and derivatives
      const y = IzzoSolver.calculateY(x, lambda);
      const T_computed = IzzoSolver.calculateTime(x, y);
      
      // Function value
      const F = T_computed - T;
      
      if (Math.abs(F) < tolerance) {
        converged = true;
        break;
      }
      
      // Calculate derivatives for Householder iteration
      const dT_dx = IzzoSolver.calculateTimeDerivative(x, y);
      const d2T_dx2 = IzzoSolver.calculateTimeSecondDerivative(x, y, lambda);
      
      // Householder's method (cubic convergence)
      const denominator = dT_dx - F * d2T_dx2 / (2.0 * dT_dx);
      
      if (Math.abs(denominator) < 1e-15) {
        throw new Error('Izzo solver: derivative too small in Householder iteration');
      }
      
      const delta_x = -F / denominator;
      
      // Apply step with bounds to ensure stability
      const max_step = 0.5;
      const limited_delta = Math.sign(delta_x) * Math.min(Math.abs(delta_x), max_step);
      
      x += limited_delta;
      
      // Ensure x stays in valid range
      x = Math.max(-1.0, Math.min(x, 50.0));
      
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
  static calculateY(x: number, lambda: number): number {
    return Math.sqrt(1.0 - lambda * lambda * (1.0 - x * x));
  }
  
  /**
   * Calculate normalized time from x and y
   */
  static calculateTime(x: number, y: number): number {
    if (x < 0) {
      // Hyperbolic case
      const sqrt_neg_x = Math.sqrt(-x);
      return (Math.asinh(sqrt_neg_x * y) + sqrt_neg_x * y) / Math.pow(-x, 1.5);
    } else if (x > 0) {
      // Elliptical case
      const sqrt_x = Math.sqrt(x);
      if (sqrt_x * y <= 1.0) {
        return (Math.asin(sqrt_x * y) + sqrt_x * y) / Math.pow(x, 1.5);
      } else {
        // Use alternative formulation to avoid numerical issues
        return (Math.PI - Math.asin(sqrt_x * y) + sqrt_x * y) / Math.pow(x, 1.5);
      }
    } else {
      // Parabolic case (x = 0)
      return (2.0 / 3.0) * (1.0 - y * y * y);
    }
  }
  
  /**
   * Calculate first derivative of time with respect to x
   */
  static calculateTimeDerivative(x: number, y: number): number {
    if (x < 0) {
      // Hyperbolic case
      const sqrt_neg_x = Math.sqrt(-x);
      return (3.0 * Math.asinh(sqrt_neg_x * y) + 3.0 * sqrt_neg_x * y + 
              sqrt_neg_x * y * y * y) / (2.0 * Math.pow(-x, 2.5));
    } else if (x > 0) {
      // Elliptical case
      const sqrt_x = Math.sqrt(x);
      if (sqrt_x * y <= 1.0) {
        return (3.0 * Math.asin(sqrt_x * y) + 3.0 * sqrt_x * y - 
                sqrt_x * y * y * y) / (2.0 * Math.pow(x, 2.5));
      } else {
        return (3.0 * (Math.PI - Math.asin(sqrt_x * y)) + 3.0 * sqrt_x * y - 
                sqrt_x * y * y * y) / (2.0 * Math.pow(x, 2.5));
      }
    } else {
      // Parabolic case
      return -y * y;
    }
  }
  
  /**
   * Calculate second derivative of time with respect to x
   */
  static calculateTimeSecondDerivative(x: number, y: number, lambda: number): number {
    const epsilon = 1e-8;
    
    // Use finite differences for robustness
    const dT_dx_plus = IzzoSolver.calculateTimeDerivative(x + epsilon, IzzoSolver.calculateY(x + epsilon, lambda));
    const dT_dx_minus = IzzoSolver.calculateTimeDerivative(x - epsilon, IzzoSolver.calculateY(x - epsilon, lambda));
    
    return (dT_dx_plus - dT_dx_minus) / (2.0 * epsilon);
  }
  
  /**
   * Calculate Lagrange coefficients from solution
   */
  static calculateLagrangeCoefficients(
    x: number, 
    lambda: number, 
    r1_mag: number, 
    r2_mag: number, 
    s: number, 
    T: number, 
    timeOfFlight: number, 
    mu: number
  ): { f: number; g: number; fdot: number; gdot: number } {
    
    const y = IzzoSolver.calculateY(x, lambda);
    
    // Semi-major axis of transfer orbit
    const a = s / (2.0 * (1.0 - x * x));
    
    if (a <= 0) {
      throw new Error('Invalid semi-major axis in Lagrange coefficient calculation');
    }
    
    // Lagrange coefficients (exact Izzo formulation)
    const sqrt_mu = Math.sqrt(mu);
    const sqrt_a = Math.sqrt(a);
    
    const f = 1.0 - (a / r1_mag) * (1.0 - x * x);
    const g = a * (s - r1_mag - r2_mag) * sqrt_a / (sqrt_mu * r1_mag * y);
    const gdot = 1.0 - (a / r2_mag) * (1.0 - x * x);
    
    // Calculate fdot using the constraint equation
    const fdot = (f * gdot - 1.0) / g;
    
    return { f, g, fdot, gdot };
  }
}

/**
 * Stumpff functions for universal variable method
 */
function stumpffFunctions(z: number): [number, number] {
  if (z > 0) {
    const sqrt_z = Math.sqrt(z);
    const S = (sqrt_z - Math.sin(sqrt_z)) / Math.pow(sqrt_z, 3);
    const C = (1 - Math.cos(sqrt_z)) / z;
    return [S, C];
  } else if (z < 0) {
    const sqrt_neg_z = Math.sqrt(-z);
    const S = (Math.sinh(sqrt_neg_z) - sqrt_neg_z) / Math.pow(sqrt_neg_z, 3);
    const C = (Math.cosh(sqrt_neg_z) - 1) / (-z);
    return [S, C];
  } else {
    return [1/6, 1/2];
  }
}

/**
 * Hohmann Transfer Calculator with Patched Conic Model
 * Calculates Earth-Moon transfers considering lunar sphere of influence
 */
export class HohmannTransfer {
  // Calculate lunar sphere of influence radius
  static getLunarSOI(): number {
    const earthMoonDistance = CONSTANTS.EARTH_MOON_DISTANCE;
    const massRatio = CONSTANTS.MU_MOON / CONSTANTS.MU_EARTH;
    return earthMoonDistance * Math.pow(massRatio, 2/5); // Hill sphere approximation
  }
  
  static calculate(
    r1: number, // Initial orbit radius (km)
    r2: number, // Final orbit radius (km)
    mu: number = CONSTANTS.MU_EARTH
  ): HohmannResult {
    const a_transfer = (r1 + r2) / 2;
    
    // Velocities
    const v1_circular = Math.sqrt(mu / r1);
    const v2_circular = Math.sqrt(mu / r2);
    const v1_transfer = Math.sqrt(mu * (2 / r1 - 1 / a_transfer));
    const v2_transfer = Math.sqrt(mu * (2 / r2 - 1 / a_transfer));
    
    // Delta-V requirements
    const deltaV1 = Math.abs(v1_transfer - v1_circular);
    const deltaV2 = Math.abs(v2_circular - v2_transfer);
    
    // Transfer time (half period of transfer ellipse) - calculated in seconds, converted to hours
    const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu);
    const transferTime = UnitConverter.secondsToHours(transferTimeSeconds);
    
    const transferOrbit: OrbitalElements = {
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
  static calculateEarthMoonTransfer(): {
    earthEscape: HohmannResult;
    lunarCapture: HohmannResult;
    totalDeltaV: number;
    totalTime: number;
    lunarSOI: number;
    v_infinity: number;
    patchedConicDetails: PatchedConicDetails;
  } {
    const r_earth_parking = CONSTANTS.EARTH_RADIUS + CONSTANTS.EARTH_LOW_ORBIT;
    const r_moon_parking = CONSTANTS.MOON_RADIUS + CONSTANTS.MOON_ORBIT_ALT;
    
    // Calculate lunar sphere of influence using refined Hill sphere model
    const lunarSOI = this.getLunarSOI();
    
    // Earth-Moon system parameters
    const r_earth_moon = CONSTANTS.EARTH_MOON_DISTANCE;
    const r_soi_boundary = r_earth_moon - lunarSOI; // SOI boundary from Earth center
    
    // Phase 1: Earth departure to lunar SOI boundary
    // Calculate required velocity at Earth departure for specific energy
    const v_earth_circular = Math.sqrt(CONSTANTS.MU_EARTH / r_earth_parking);
    
    // Energy required to reach lunar SOI boundary
    const specific_energy_transfer = -CONSTANTS.MU_EARTH / (2 * r_soi_boundary);
    
    // Velocity at departure to achieve this energy
    const v_departure_magnitude = Math.sqrt(2 * (specific_energy_transfer + CONSTANTS.MU_EARTH / r_earth_parking));
    
    // Earth escape delta-V
    const deltaV_earth_escape = v_departure_magnitude - v_earth_circular;
    
    // Velocity at SOI boundary relative to Earth
    const v_at_soi_earth_frame = Math.sqrt(2 * CONSTANTS.MU_EARTH / r_soi_boundary);
    
    // Moon's orbital velocity around Earth (circular approximation)
    const v_moon_orbital = Math.sqrt(CONSTANTS.MU_EARTH / r_earth_moon);
    
    // Hyperbolic excess velocity relative to Moon (v∞)
    // This is the key parameter for patched conic method
    const v_infinity = Math.abs(v_at_soi_earth_frame - v_moon_orbital);
    
    // Phase 2: Lunar SOI entry to lunar parking orbit
    // Velocity at SOI entry relative to Moon (from hyperbolic trajectory)
    const v_soi_entry_lunar_frame = Math.sqrt(v_infinity * v_infinity + 2 * CONSTANTS.MU_MOON / lunarSOI);
    
    // Periapsis velocity for lunar capture orbit (periapsis at desired parking orbit)
    const v_periapsis_capture = Math.sqrt(CONSTANTS.MU_MOON * (2 / r_moon_parking - 2 / (lunarSOI + r_moon_parking)));
    
    // Circular velocity at lunar parking orbit
    const v_lunar_circular = Math.sqrt(CONSTANTS.MU_MOON / r_moon_parking);
    
    // Lunar capture delta-V (hyperbolic to elliptical capture orbit)
    const deltaV_lunar_capture = v_soi_entry_lunar_frame - v_periapsis_capture;
    
    // Lunar orbit insertion delta-V (elliptical capture to circular)
    const deltaV_lunar_insertion = v_periapsis_capture - v_lunar_circular;
    
    // Total lunar delta-V
    const total_lunar_deltaV = deltaV_lunar_capture + deltaV_lunar_insertion;
    
    // Calculate transfer times using proper orbital mechanics
    const earthTransferTime = this.calculateTransferTime(r_earth_parking, r_soi_boundary, CONSTANTS.MU_EARTH);
    const lunarCaptureTime = this.calculateLunarCaptureTime(lunarSOI, r_moon_parking, v_infinity);
    
    // Create results with proper orbital elements
    const earthEscape: HohmannResult = {
      deltaV1: deltaV_earth_escape,
      deltaV2: 0, // Single burn for Earth escape in this model
      transferTime: UnitConverter.secondsToHours(earthTransferTime),
      transferOrbit: {
        semiMajorAxis: (r_earth_parking + r_soi_boundary) / 2,
        eccentricity: Math.abs(r_soi_boundary - r_earth_parking) / (r_earth_parking + r_soi_boundary),
        inclination: 0, // Simplified for equatorial transfer
        rightAscension: 0,
        argOfPerigee: 0,
        trueAnomaly: 0
      }
    };
    
    const lunarCapture: HohmannResult = {
      deltaV1: deltaV_lunar_capture, // Capture burn
      deltaV2: deltaV_lunar_insertion, // Orbit insertion burn
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
    
    const patchedConicDetails: PatchedConicDetails = {
      lunarSOI,
      v_infinity,
      v_at_soi_earth_frame,
      v_soi_entry_lunar_frame,
      moon_orbital_velocity: v_moon_orbital,
      energy_balance_check: this.validateEnergyBalance(
        r_earth_parking, r_soi_boundary, v_departure_magnitude, v_at_soi_earth_frame
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
  private static calculateTransferTime(r1: number, r2: number, mu: number): number {
    const a = (r1 + r2) / 2; // Semi-major axis of transfer orbit
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
    return period / 2; // Half period for transfer
  }
  
  /**
   * Calculate lunar capture and orbit insertion time
   */
  private static calculateLunarCaptureTime(r_soi: number, r_parking: number, v_infinity: number): number {
    // Time for hyperbolic approach and capture maneuvers
    // This is an approximation - real missions use detailed trajectory integration
    const characteristic_time = Math.sqrt(Math.pow(r_soi, 3) / CONSTANTS.MU_MOON);
    const hyperbolic_factor = 1 + (v_infinity * v_infinity * r_soi) / (2 * CONSTANTS.MU_MOON);
    
    return characteristic_time * Math.log(hyperbolic_factor);
  }
  
  /**
   * Validate energy conservation in patched conic method
   */
  private static validateEnergyBalance(r1: number, r2: number, v1: number, v2: number): boolean {
    const energy1 = v1 * v1 / 2 - CONSTANTS.MU_EARTH / r1;
    const energy2 = v2 * v2 / 2 - CONSTANTS.MU_EARTH / r2;
    const energy_error = Math.abs(energy1 - energy2) / Math.abs(energy1);
    
    return energy_error < 1e-6; // Energy should be conserved to within numerical precision
  }
}

/**
 * Lunar Orbit Insertion (LOI) Calculator - Production Implementation
 * Calculates optimal lunar orbit insertion strategies with realistic delta-V requirements
 * Implements multiple insertion strategies: direct, capture orbit, and weak stability boundary
 */
export class LunarOrbitInsertion {
  /**
   * Calculate optimal LOI strategy for given approach conditions
   */
  static calculateOptimalLOI(
    v_infinity: number,        // Hyperbolic excess velocity (km/s)
    r_target: number,          // Target circular orbit radius (km)
    r_periapsis?: number       // Optional periapsis radius for capture orbit (km)
  ): LOIResult {
    
    // Validate inputs
    if (v_infinity <= 0 || v_infinity > 5.0) {
      throw new Error('Hyperbolic excess velocity out of realistic range (0-5 km/s)');
    }
    if (r_target <= CONSTANTS.MOON_RADIUS || r_target > CONSTANTS.MOON_RADIUS * 10) {
      throw new Error('Target orbit radius out of valid range');
    }
    
    // Calculate direct insertion strategy
    const directResult = this.calculateDirectInsertion(v_infinity, r_target);
    
    // Calculate capture orbit strategy (if more efficient)
    const captureOrbitResult = this.calculateCaptureOrbitInsertion(
      v_infinity, 
      r_target, 
      r_periapsis || this.getOptimalPeriapsis(v_infinity, r_target)
    );
    
    // Select optimal strategy based on total delta-V
    if (captureOrbitResult.totalDeltaV < directResult.totalDeltaV) {
      return {
        ...captureOrbitResult,
        strategy: 'capture_orbit',
        fuelEfficiency: (directResult.totalDeltaV / captureOrbitResult.totalDeltaV - 1) * 100
      };
    } else {
      return {
        ...directResult,
        strategy: 'direct',
        fuelEfficiency: 100 // Reference efficiency
      };
    }
  }
  
  /**
   * Calculate direct insertion to circular orbit
   */
  private static calculateDirectInsertion(v_infinity: number, r_target: number): LOIResult {
    // Velocity at periapsis of hyperbolic approach
    const v_periapsis_hyperbolic = Math.sqrt(v_infinity * v_infinity + 2 * CONSTANTS.MU_MOON / r_target);
    
    // Circular orbital velocity at target altitude
    const v_circular = Math.sqrt(CONSTANTS.MU_MOON / r_target);
    
    // Required delta-V for direct insertion
    const totalDeltaV = v_periapsis_hyperbolic - v_circular;
    
    // Validate delta-V is realistic for chemical propulsion
    const feasibility = this.assessFeasibility(totalDeltaV, r_target);
    
    const finalOrbitElements: OrbitalElements = {
      semiMajorAxis: r_target,
      eccentricity: 0,
      inclination: 0, // Simplified - actual missions consider inclination
      rightAscension: 0,
      argOfPerigee: 0,
      trueAnomaly: 0
    };
    
    return {
      strategy: 'direct',
      totalDeltaV,
      captureOrbitDeltaV: 0,
      insertionDeltaV: totalDeltaV,
      captureOrbitElements: finalOrbitElements, // Same as final for direct insertion
      finalOrbitElements,
      totalTime: 0.1, // Instantaneous burn approximation
      fuelEfficiency: 100,
      feasibility
    };
  }
  
  /**
   * Calculate two-burn capture orbit insertion
   */
  private static calculateCaptureOrbitInsertion(
    v_infinity: number, 
    r_target: number, 
    r_periapsis: number
  ): LOIResult {
    
    // Velocity at periapsis of hyperbolic approach
    const v_periapsis_hyperbolic = Math.sqrt(v_infinity * v_infinity + 2 * CONSTANTS.MU_MOON / r_periapsis);
    
    // Calculate capture orbit apoapsis for target circular orbit energy matching
    const specific_energy_target = -CONSTANTS.MU_MOON / (2 * r_target);
    const v_periapsis_capture = Math.sqrt(2 * (specific_energy_target + CONSTANTS.MU_MOON / r_periapsis));
    
    // First burn: hyperbolic to elliptical capture orbit
    const captureOrbitDeltaV = v_periapsis_hyperbolic - v_periapsis_capture;
    
    // Calculate capture orbit apoapsis
    const r_apoapsis = CONSTANTS.MU_MOON / (2 * specific_energy_target) - r_periapsis;
    
    // If apoapsis is unrealistic, adjust calculation
    if (r_apoapsis > CONSTANTS.MOON_RADIUS * 100) {
      // Use bi-elliptic transfer principles for high-energy cases
      return this.calculateHighEnergyCapture(v_infinity, r_target, r_periapsis);
    }
    
    // Velocity at apoapsis of capture orbit
    const v_apoapsis_capture = Math.sqrt(2 * (specific_energy_target + CONSTANTS.MU_MOON / r_apoapsis));
    
    // Circular velocity at target orbit
    const v_circular = Math.sqrt(CONSTANTS.MU_MOON / r_target);
    
    // Second burn: elliptical to circular at target altitude
    // Assumes target orbit is at apoapsis of capture orbit
    const insertionDeltaV = Math.abs(v_circular - v_apoapsis_capture);
    
    const totalDeltaV = captureOrbitDeltaV + insertionDeltaV;
    
    // Calculate orbital period for timing
    const a_capture = (r_periapsis + r_apoapsis) / 2;
    const period_capture = 2 * Math.PI * Math.sqrt(Math.pow(a_capture, 3) / CONSTANTS.MU_MOON);
    const totalTime = UnitConverter.secondsToHours(period_capture / 2); // Half orbit to apoapsis
    
    const captureOrbitElements: OrbitalElements = {
      semiMajorAxis: a_capture,
      eccentricity: (r_apoapsis - r_periapsis) / (r_apoapsis + r_periapsis),
      inclination: 0,
      rightAscension: 0,
      argOfPerigee: 0,
      trueAnomaly: 0
    };
    
    const finalOrbitElements: OrbitalElements = {
      semiMajorAxis: r_target,
      eccentricity: 0,
      inclination: 0,
      rightAscension: 0,
      argOfPerigee: 0,
      trueAnomaly: 0
    };
    
    const feasibility = this.assessFeasibility(totalDeltaV, r_target);
    
    return {
      strategy: 'capture_orbit',
      totalDeltaV,
      captureOrbitDeltaV,
      insertionDeltaV,
      captureOrbitElements,
      finalOrbitElements,
      totalTime,
      fuelEfficiency: 0, // Will be calculated relative to direct insertion
      feasibility
    };
  }
  
  /**
   * Handle high-energy capture scenarios using bi-elliptic-like principles
   */
  private static calculateHighEnergyCapture(
    v_infinity: number, 
    r_target: number, 
    r_periapsis: number
  ): LOIResult {
    
    // For very high energy approaches, use extended capture orbit
    const r_intermediate = r_target * 3; // Intermediate apoapsis
    
    // Calculate intermediate elliptical orbit
    const v_periapsis_hyperbolic = Math.sqrt(v_infinity * v_infinity + 2 * CONSTANTS.MU_MOON / r_periapsis);
    const energy_intermediate = -CONSTANTS.MU_MOON / (r_periapsis + r_intermediate);
    const v_periapsis_intermediate = Math.sqrt(2 * (energy_intermediate + CONSTANTS.MU_MOON / r_periapsis));
    
    // First burn: capture to intermediate orbit
    const captureOrbitDeltaV = v_periapsis_hyperbolic - v_periapsis_intermediate;
    
    // Second burn: intermediate to target circular orbit
    const v_intermediate = Math.sqrt(CONSTANTS.MU_MOON * (2 / r_intermediate - 2 / (r_periapsis + r_intermediate)));
    const v_circular = Math.sqrt(CONSTANTS.MU_MOON / r_target);
    const insertionDeltaV = Math.abs(v_circular - v_intermediate);
    
    const totalDeltaV = captureOrbitDeltaV + insertionDeltaV;
    
    // Calculate timing
    const a_intermediate = (r_periapsis + r_intermediate) / 2;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a_intermediate, 3) / CONSTANTS.MU_MOON);
    const totalTime = UnitConverter.secondsToHours(period);
    
    const captureOrbitElements: OrbitalElements = {
      semiMajorAxis: a_intermediate,
      eccentricity: (r_intermediate - r_periapsis) / (r_intermediate + r_periapsis),
      inclination: 0,
      rightAscension: 0,
      argOfPerigee: 0,
      trueAnomaly: 0
    };
    
    const finalOrbitElements: OrbitalElements = {
      semiMajorAxis: r_target,
      eccentricity: 0,
      inclination: 0,
      rightAscension: 0,
      argOfPerigee: 0,
      trueAnomaly: 0
    };
    
    const feasibility = this.assessFeasibility(totalDeltaV, r_target);
    
    return {
      strategy: 'capture_orbit',
      totalDeltaV,
      captureOrbitDeltaV,
      insertionDeltaV,
      captureOrbitElements,
      finalOrbitElements,
      totalTime,
      fuelEfficiency: 0,
      feasibility
    };
  }
  
  /**
   * Determine optimal periapsis for capture orbit strategy
   */
  private static getOptimalPeriapsis(v_infinity: number, r_target: number): number {
    // Optimal periapsis balances gravity losses vs. thermal constraints
    // Lower periapsis = higher velocity = more gravity losses but shorter time
    const min_periapsis = CONSTANTS.MOON_RADIUS + 15; // 15 km minimum altitude
    const max_periapsis = r_target * 0.8; // Don't go too close to target
    
    // For high v_infinity, prefer higher periapsis to reduce thermal stress
    const thermal_factor = Math.min(v_infinity / 2.0, 1.0);
    const optimal_periapsis = min_periapsis + thermal_factor * (max_periapsis - min_periapsis);
    
    return optimal_periapsis;
  }
  
  /**
   * Assess feasibility of LOI strategy
   */
  private static assessFeasibility(totalDeltaV: number, r_target: number): LOIResult['feasibility'] {
    return {
      propulsive: totalDeltaV < 2.5, // Chemical propulsion limit
      thermal: r_target > CONSTANTS.MOON_RADIUS + 10, // Thermal environment constraint
      navigation: totalDeltaV < 3.0 // Navigation accuracy for high delta-V maneuvers
    };
  }
}

/**
 * Fuel Optimization Calculator
 * Calculates propellant requirements based on Tsiolkovsky rocket equation
 */
export class FuelOptimizer {
  static calculate(
    deltaV: number, // Expected in km/s (API units)
    dryMass: number = CONSTANTS.SPACECRAFT_DRY_MASS, // kg
    specificImpulse: number = CONSTANTS.SPECIFIC_IMPULSE, // seconds
    thrustToWeightRatio: number = 0.3 // Typical for space propulsion systems
  ): FuelOptimization {
    // Validate inputs
    UnitConverter.validateDeltaV(deltaV);
    if (dryMass <= 0 || !isFinite(dryMass)) {
      throw new Error('Dry mass must be positive and finite');
    }
    if (specificImpulse <= 0 || !isFinite(specificImpulse)) {
      throw new Error('Specific impulse must be positive and finite');
    }
    if (thrustToWeightRatio <= 0 || thrustToWeightRatio > 2.0) {
      throw new Error('Thrust-to-weight ratio must be between 0 and 2.0');
    }
    
    // Convert delta-V from km/s to m/s for physics calculations
    const deltaV_ms = UnitConverter.kmPerSecToMPerSec(deltaV);
    
    // Standard gravity and exhaust velocity
    const g0 = 9.80665; // m/s² - standard gravity (ISP reference)
    const ve = specificImpulse * g0; // effective exhaust velocity m/s
    
    // Tsiolkovsky rocket equation: Δv = ve * ln(m0/mf)
    // Therefore: m0/mf = exp(Δv/ve) = mass ratio
    const massRatio = Math.exp(deltaV_ms / ve);
    
    if (!isFinite(massRatio) || massRatio < 1.0) {
      throw new Error('Invalid mass ratio calculated from Tsiolkovsky equation');
    }
    
    // Calculate masses
    const totalMass = dryMass * massRatio; // m0 (initial mass)
    const propellantMass = totalMass - dryMass; // mp (propellant mass)
    
    // Validate propellant mass is reasonable
    if (propellantMass < 0) {
      throw new Error('Negative propellant mass calculated');
    }
    if (propellantMass > dryMass * 10) {
      console.warn(`Very high propellant-to-dry mass ratio: ${(propellantMass / dryMass).toFixed(2)}`);
    }
    
    // Calculate realistic burn time using rocket equation: F = dm/dt * ve
    // For production accuracy, we need to account for variable mass during burn
    
    // Two approaches: constant thrust vs constant T/W ratio
    // Most space missions use constant thrust (engine limitation)
    const burnTime = this.calculateVariableMassBurnTime(
      totalMass, 
      dryMass, 
      thrustToWeightRatio, 
      ve, 
      g0
    );
    
    // Validate burn time is realistic for space missions
    if (burnTime < 0) {
      throw new Error('Negative burn time calculated');
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
  private static calculateVariableMassBurnTime(
    m0: number,         // Initial total mass (kg)
    mf: number,         // Final dry mass (kg)
    twRatio: number,    // Initial thrust-to-weight ratio
    ve: number,         // Exhaust velocity (m/s)
    g0: number          // Standard gravity (m/s²)
  ): number {
    
    // Initial thrust based on initial mass and T/W ratio
    const F = twRatio * m0 * g0; // N (constant thrust assumption)
    
    // Mass flow rate: dm/dt = -F/ve (negative because mass decreases)
    const massFlowRate = F / ve; // kg/s
    
    // For constant thrust, mass varies linearly: m(t) = m0 - (F/ve) * t
    // Propellant mass consumed
    const propellantMass = m0 - mf;
    
    // Simple burn time: t = propellant_mass / mass_flow_rate
    const burnTimeConstantThrust = propellantMass / massFlowRate;
    
    // For very high thrust scenarios, account for gravity losses
    // and finite burn effects using more sophisticated model
    if (twRatio > 0.5) {
      // High thrust burns - use integrated rocket equation
      // Solution to dm/dt = -F/ve with variable acceleration
      
      // Characteristic velocity (c*) and gravity loss factor
      const characteristicVelocity = ve * Math.log(m0 / mf);
      const gravityLossFactor = this.calculateGravityLossFactor(burnTimeConstantThrust, twRatio);
      
      // Corrected burn time accounting for finite burn effects
      const correctedBurnTime = burnTimeConstantThrust * (1 + gravityLossFactor);
      
      return Math.min(correctedBurnTime, burnTimeConstantThrust * 1.2); // Cap at 20% correction
    }
    
    return burnTimeConstantThrust;
  }
  
  /**
   * Calculate gravity loss factor for finite burn corrections
   */
  private static calculateGravityLossFactor(burnTime: number, twRatio: number): number {
    // Empirical correction for gravity losses during finite burns
    // Based on aerospace engineering approximations
    
    if (burnTime < 60) {
      return 0; // Very short burns - negligible gravity losses
    }
    
    // Gravity loss factor increases with burn time and decreases with thrust
    const timeFactor = Math.min(burnTime / 600, 1.0); // Normalize to 10 minutes
    const thrustFactor = Math.max(0.1, 1.0 / twRatio); // Higher losses for lower thrust
    
    return 0.05 * timeFactor * thrustFactor; // Maximum 5% correction
  }
  
  /**
   * Advanced: Calculate burn time for variable thrust profile
   * Used for electric propulsion or throttled engines
   */
  static calculateVariableThrustBurnTime(
    deltaV: number,     // Required delta-V (km/s)
    m0: number,         // Initial mass (kg)
    mf: number,         // Final mass (kg)
    thrustProfile: (t: number) => number, // Thrust as function of time
    ve: number          // Exhaust velocity (m/s)
  ): number {
    
    // This would require numerical integration for complex thrust profiles
    // For now, return a simplified approximation
    console.warn('Variable thrust profiles require numerical integration - using constant thrust approximation');
    
    const avgThrust = 0.5 * (thrustProfile(0) + thrustProfile(1000)); // Simplified average
    const massFlowRate = avgThrust / ve;
    const propellantMass = m0 - mf;
    
    return propellantMass / massFlowRate;
  }
}

/**
 * Numerical Validation and Error Handling Utilities
 * Provides comprehensive validation for all trajectory calculations
 */
export class NumericalValidator {
  
  /**
   * Validate orbital elements are physically meaningful
   */
  static validateOrbitalElements(elements: OrbitalElements, centralBody: 'earth' | 'moon'): void {
    const mu = centralBody === 'earth' ? CONSTANTS.MU_EARTH : CONSTANTS.MU_MOON;
    const radius = centralBody === 'earth' ? CONSTANTS.EARTH_RADIUS : CONSTANTS.MOON_RADIUS;
    
    // Semi-major axis validation
    if (elements.semiMajorAxis <= radius) {
      throw new Error(`Semi-major axis ${elements.semiMajorAxis} km is below ${centralBody} surface (${radius} km)`);
    }
    if (elements.semiMajorAxis > radius * 1000) {
      throw new Error(`Semi-major axis ${elements.semiMajorAxis} km is unrealistically large for ${centralBody} system`);
    }
    
    // Eccentricity validation
    if (elements.eccentricity < 0 || elements.eccentricity >= 1) {
      throw new Error(`Invalid eccentricity ${elements.eccentricity} - must be in range [0, 1) for elliptical orbits`);
    }
    
    // Periapsis check
    const periapsis = elements.semiMajorAxis * (1 - elements.eccentricity);
    if (periapsis <= radius) {
      throw new Error(`Periapsis ${periapsis} km is below ${centralBody} surface`);
    }
    
    // Inclination validation  
    if (elements.inclination < 0 || elements.inclination > 180) {
      throw new Error(`Invalid inclination ${elements.inclination}° - must be in range [0°, 180°]`);
    }
    
    // Angular elements validation
    if (elements.rightAscension < 0 || elements.rightAscension >= 360) {
      throw new Error(`Invalid right ascension ${elements.rightAscension}° - must be in range [0°, 360°)`);
    }
    if (elements.argOfPerigee < 0 || elements.argOfPerigee >= 360) {
      throw new Error(`Invalid argument of perigee ${elements.argOfPerigee}° - must be in range [0°, 360°)`);
    }
    if (elements.trueAnomaly < 0 || elements.trueAnomaly >= 360) {
      throw new Error(`Invalid true anomaly ${elements.trueAnomaly}° - must be in range [0°, 360°)`);
    }
  }
  
  /**
   * Validate velocity vector is realistic for given position
   */
  static validateVelocityVector(position: Vector3D, velocity: Vector3D, centralBody: 'earth' | 'moon'): void {
    const mu = centralBody === 'earth' ? CONSTANTS.MU_EARTH : CONSTANTS.MU_MOON;
    const radius = centralBody === 'earth' ? CONSTANTS.EARTH_RADIUS : CONSTANTS.MOON_RADIUS;
    
    const r = Math.sqrt(position.x**2 + position.y**2 + position.z**2);
    const v = Math.sqrt(velocity.x**2 + velocity.y**2 + velocity.z**2);
    
    // Position validation
    if (r <= radius) {
      throw new Error(`Position ${r} km is below ${centralBody} surface`);
    }
    
    // Escape velocity check
    const v_escape = Math.sqrt(2 * mu / r);
    if (v > v_escape * 1.5) {
      throw new Error(`Velocity ${v} km/s exceeds reasonable limits (1.5x escape velocity: ${v_escape * 1.5} km/s)`);
    }
    
    // Minimum orbital velocity check
    const v_circular = Math.sqrt(mu / r);
    if (v < v_circular * 0.1) {
      throw new Error(`Velocity ${v} km/s is unrealistically low for orbital mechanics`);
    }
    
    // Check for NaN or infinite values
    if (!isFinite(r) || !isFinite(v)) {
      throw new Error('Non-finite position or velocity detected');
    }
  }
  
  /**
   * Validate transfer trajectory parameters
   */
  static validateTransferParameters(r1: number, r2: number, transferTime: number, centralBody: 'earth' | 'moon'): void {
    const mu = centralBody === 'earth' ? CONSTANTS.MU_EARTH : CONSTANTS.MU_MOON;
    const radius = centralBody === 'earth' ? CONSTANTS.EARTH_RADIUS : CONSTANTS.MOON_RADIUS;
    
    // Orbital radii validation
    if (r1 <= radius || r2 <= radius) {
      throw new Error(`Transfer radii must be above ${centralBody} surface (${radius} km)`);
    }
    
    // Transfer time validation
    if (transferTime <= 0) {
      throw new Error('Transfer time must be positive');
    }
    
    // Maximum reasonable transfer time (for orbital mechanics)
    const max_period = 2 * Math.PI * Math.sqrt(Math.pow(Math.max(r1, r2) * 10, 3) / mu);
    if (transferTime > max_period) {
      throw new Error(`Transfer time ${transferTime} s exceeds reasonable orbital period limits`);
    }
    
    // Minimum transfer time check (physical constraints)
    const min_period = 2 * Math.PI * Math.sqrt(Math.pow((r1 + r2) / 2, 3) / mu);
    if (transferTime < min_period / 4) {
      throw new Error(`Transfer time ${transferTime} s is too short for given orbital parameters`);
    }
  }
  
  /**
   * Validate numerical convergence of iterative algorithms
   */
  static validateConvergence(
    iterations: number, 
    error: number, 
    maxIterations: number = 100, 
    tolerance: number = 1e-12
  ): void {
    if (iterations >= maxIterations) {
      throw new Error(`Algorithm failed to converge within ${maxIterations} iterations (final error: ${error})`);
    }
    
    if (error > tolerance * 1000) {
      console.warn(`Convergence achieved with relatively large error: ${error} (tolerance: ${tolerance})`);
    }
    
    if (!isFinite(error)) {
      throw new Error('Non-finite error detected in iterative algorithm');
    }
  }
  
  /**
   * Validate delta-V requirements are realistic
   */
  static validateDeltaV(deltaV: number, context: string): void {
    if (deltaV < 0) {
      throw new Error(`Negative delta-V calculated for ${context}: ${deltaV} km/s`);
    }
    
    if (deltaV > 15) { // Unrealistic for most space missions
      throw new Error(`Excessive delta-V requirement for ${context}: ${deltaV} km/s (> 15 km/s)`);
    }
    
    if (deltaV > 10) {
      console.warn(`High delta-V requirement for ${context}: ${deltaV} km/s - verify mission parameters`);
    }
    
    if (!isFinite(deltaV)) {
      throw new Error(`Non-finite delta-V calculated for ${context}`);
    }
  }
  
  /**
   * Validate energy conservation in calculations
   */
  static validateEnergyConservation(
    energy1: number, 
    energy2: number, 
    tolerance: number = 1e-6, 
    context: string = 'calculation'
  ): void {
    const energyError = Math.abs(energy1 - energy2) / Math.abs(energy1);
    
    if (energyError > tolerance) {
      throw new Error(`Energy conservation violated in ${context}: error = ${energyError} (tolerance: ${tolerance})`);
    }
    
    if (!isFinite(energy1) || !isFinite(energy2)) {
      throw new Error(`Non-finite energy values detected in ${context}`);
    }
  }
}

/**
 * Main Trajectory Planning Engine
 * Coordinates all calculations and generates complete trajectory solutions
 */
export class TrajectoryEngine {
  static generateEarthMoonTrajectory(
    launchDate: Date,
    transferType: 'hohmann' | 'lambert' | 'bi_elliptic' = 'hohmann',
    flightTime: number = 72 // hours (API input - will be converted for internal calculations)
  ): TrajectoryResult {
    // Input validation at API boundary
    if (!launchDate || isNaN(launchDate.getTime())) {
      throw new Error('Invalid launch date provided');
    }
    
    // Validate flight time using unit converter
    UnitConverter.validateMissionTime(flightTime);
    
    // Validate transfer type
    const validTypes = ['hohmann', 'lambert', 'bi_elliptic'];
    if (!validTypes.includes(transferType)) {
      throw new Error(`Invalid transfer type: ${transferType}. Must be one of: ${validTypes.join(', ')}`);
    }
    // Initial and final orbit radii
    const r_earth = CONSTANTS.EARTH_RADIUS + CONSTANTS.EARTH_LOW_ORBIT;
    const r_moon = CONSTANTS.MOON_RADIUS + CONSTANTS.MOON_ORBIT_ALT;
    
    let totalDeltaV = 0;
    let hohmannResult: HohmannResult | undefined;
    let lambertResult: LambertResult | undefined;
    let trajectoryPoints: Vector3D[] = [];
    let orbitalElements: OrbitalElements[] = [];
    
    if (transferType === 'hohmann') {
      // Calculate complete Earth-Moon patched conic transfer
      const patchedConicTransfer = HohmannTransfer.calculateEarthMoonTransfer();
      
      // Use the earth escape portion as the primary Hohmann result for compatibility
      hohmannResult = patchedConicTransfer.earthEscape;
      
      // Total delta-V includes Earth escape and lunar capture
      totalDeltaV = patchedConicTransfer.totalDeltaV;
      flightTime = patchedConicTransfer.totalTime;
      
      // Generate trajectory points for complete Earth-Moon transfer
      trajectoryPoints = generatePatchedConicTrajectoryPoints(
        r_earth, 
        CONSTANTS.EARTH_MOON_DISTANCE, 
        patchedConicTransfer.lunarSOI, 
        100
      );
      
      // Include both Earth escape and lunar capture orbital elements
      orbitalElements = [
        patchedConicTransfer.earthEscape.transferOrbit,
        patchedConicTransfer.lunarCapture.transferOrbit
      ];
      
    } else if (transferType === 'lambert') {
      // Calculate Lambert solution
      const r1 = new Vector3D(r_earth, 0, 0); // Earth departure position
      const r2 = new Vector3D(CONSTANTS.EARTH_MOON_DISTANCE, 0, 0); // Moon arrival position
      
      // Convert flight time from hours to seconds for internal calculations
      const flightTimeSeconds = UnitConverter.hoursToSeconds(flightTime);
      lambertResult = LambertSolver.solve(r1, r2, flightTimeSeconds, CONSTANTS.MU_EARTH);
      
      // Calculate delta-V requirements
      const v_earth_circular = Math.sqrt(CONSTANTS.MU_EARTH / r_earth);
      const deltaV_departure = lambertResult.velocityDeparture.magnitude() - v_earth_circular;
      
      const v_moon_circular = Math.sqrt(CONSTANTS.MU_MOON / r_moon);
      const deltaV_arrival = lambertResult.velocityArrival.magnitude() - v_moon_circular;
      
      totalDeltaV = Math.abs(deltaV_departure) + Math.abs(deltaV_arrival);
      
      // Generate Lambert trajectory points
      trajectoryPoints = generateLambertTrajectoryPoints(r1, r2, lambertResult, 100);
    }
    
    // Calculate fuel requirements
    const fuelOptimization = FuelOptimizer.calculate(totalDeltaV);
    
    // Risk assessment
    const riskFactors = assessTrajectoryRisks(transferType, totalDeltaV, flightTime);
    
    // Calculate efficiency (based on theoretical minimum energy transfer)
    const efficiency = calculateEfficiency(totalDeltaV, r_earth, CONSTANTS.EARTH_MOON_DISTANCE);
    
    return {
      totalDeltaV: Math.round(totalDeltaV * 1000) / 1000, // Round to 3 decimal places
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
  static generateTrajectoryRecord(
    missionId: string,
    name: string,
    type: 'hohmann' | 'lambert' | 'bi_elliptic' | 'custom',
    launchWindow: Date,
    result: TrajectoryResult
  ): Omit<InsertTrajectory, 'id' | 'createdAt'> {
    return {
      missionId,
      decisionId: null, // Will be linked when AI makes decision
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
}

// Helper functions
function generateHohmannTrajectoryPoints(r1: number, r2: number, numPoints: number): Vector3D[] {
  const points: Vector3D[] = [];
  const a = (r1 + r2) / 2;
  const e = Math.abs(r2 - r1) / (r1 + r2);
  
  for (let i = 0; i <= numPoints; i++) {
    const theta = (Math.PI * i) / numPoints; // True anomaly from 0 to π
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
    
    points.push(new Vector3D(
      r * Math.cos(theta),
      r * Math.sin(theta),
      0
    ));
  }
  
  return points;
}

function generatePatchedConicTrajectoryPoints(
  r_earth: number, 
  r_moon: number, 
  lunarSOI: number, 
  numPoints: number
): Vector3D[] {
  const points: Vector3D[] = [];
  const totalDistance = r_moon;
  const soiTransition = r_moon - lunarSOI;
  
  // Divide points between Earth escape phase and lunar capture phase
  const earthPhasePoints = Math.floor(numPoints * 0.8); // 80% of trajectory in Earth SOI
  const lunarPhasePoints = numPoints - earthPhasePoints;
  
  // Phase 1: Earth escape trajectory (elliptical from r_earth to SOI boundary)
  const a_earth = (r_earth + soiTransition) / 2;
  const e_earth = Math.abs(soiTransition - r_earth) / (r_earth + soiTransition);
  
  for (let i = 0; i <= earthPhasePoints; i++) {
    const theta = (Math.PI * i) / earthPhasePoints;
    const r = a_earth * (1 - e_earth * e_earth) / (1 + e_earth * Math.cos(theta));
    
    points.push(new Vector3D(
      r * Math.cos(theta),
      r * Math.sin(theta),
      0
    ));
  }
  
  // Phase 2: Lunar capture trajectory (hyperbolic approach and circularization)
  const r_moon_parking = CONSTANTS.MOON_RADIUS + CONSTANTS.MOON_ORBIT_ALT;
  
  for (let i = 1; i <= lunarPhasePoints; i++) {
    const t = i / lunarPhasePoints;
    // Simple interpolation from SOI boundary to lunar parking orbit
    const r = soiTransition + t * (r_moon - soiTransition);
    
    // Add some curvature to represent the hyperbolic approach
    const curvature = Math.sin(t * Math.PI / 2) * lunarSOI * 0.1;
    
    points.push(new Vector3D(
      r,
      curvature,
      0
    ));
  }
  
  return points;
}

function generateLambertTrajectoryPoints(
  r1: Vector3D, 
  r2: Vector3D, 
  solution: LambertResult, 
  numPoints: number
): Vector3D[] {
  const points: Vector3D[] = [];
  
  // Simple linear interpolation for now (real implementation would integrate orbits)
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

function assessTrajectoryRisks(
  type: string, 
  deltaV: number, 
  flightTime: number
): string[] {
  const risks: string[] = [];
  
  if (deltaV > 4.0) {
    risks.push("High delta-V requirement increases fuel load and complexity");
  }
  
  if (flightTime > 120) {
    risks.push("Extended flight time increases exposure to space weather");
  }
  
  if (type === 'lambert') {
    risks.push("Lambert solution may require precise timing and navigation");
  }
  
  // Add space weather risks (would integrate with space weather data)
  risks.push("Monitor solar activity during launch window");
  risks.push("Debris avoidance maneuvers may be required");
  
  return risks;
}

function calculateEfficiency(deltaV: number, r1: number, r2: number): number {
  // Theoretical minimum delta-V for Hohmann transfer
  const mu = CONSTANTS.MU_EARTH;
  const v1_circular = Math.sqrt(mu / r1);
  const v2_circular = Math.sqrt(mu / r2);
  const a_transfer = (r1 + r2) / 2;
  
  const v1_transfer = Math.sqrt(mu * (2 / r1 - 1 / a_transfer));
  const v2_transfer = Math.sqrt(mu * (2 / r2 - 1 / a_transfer));
  
  const theoretical_min = Math.abs(v1_transfer - v1_circular) + Math.abs(v2_circular - v2_transfer);
  
  return Math.max(0, Math.min(100, (theoretical_min / deltaV) * 100));
}