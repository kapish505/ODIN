"""
Lambert's Problem Solver for ODIN System
Solves the two-point boundary value problem for orbital mechanics
"""

import numpy as np
import math
from scipy.optimize import fsolve

class LambertSolver:
    """Solves Lambert's problem for trajectory planning"""
    
    def __init__(self):
        self.MU_EARTH = 3.986004418e14  # Earth's gravitational parameter (m³/s²)
        self.TOLERANCE = 1e-10
        self.MAX_ITERATIONS = 100
    
    def solve(self, r1_vec, r2_vec, transfer_time, mu=None):
        """
        Solve Lambert's problem to find velocity vectors
        
        Args:
            r1_vec: Initial position vector [x, y, z] in meters
            r2_vec: Final position vector [x, y, z] in meters  
            transfer_time: Time of flight in seconds
            mu: Gravitational parameter (defaults to Earth)
        
        Returns:
            Dictionary with velocity vectors and trajectory parameters
        """
        try:
            if mu is None:
                mu = self.MU_EARTH
                
            # Convert to numpy arrays
            r1 = np.array(r1_vec, dtype=float)
            r2 = np.array(r2_vec, dtype=float)
            
            # Calculate magnitudes
            r1_mag = np.linalg.norm(r1)
            r2_mag = np.linalg.norm(r2)
            
            # Calculate delta theta (angle between position vectors)
            cos_dtheta = np.dot(r1, r2) / (r1_mag * r2_mag)
            cos_dtheta = np.clip(cos_dtheta, -1, 1)  # Avoid numerical errors
            dtheta = math.acos(cos_dtheta)
            
            # Choose short or long way (default to short way)
            if dtheta > math.pi:
                dtheta = 2 * math.pi - dtheta
                long_way = True
            else:
                long_way = False
            
            # Calculate chord length
            c = np.linalg.norm(r2 - r1)
            
            # Calculate semi-perimeter
            s = (r1_mag + r2_mag + c) / 2
            
            # Minimum energy transfer calculations
            a_min = s / 2
            
            # Check if transfer time is feasible
            if transfer_time <= 0:
                raise ValueError("Transfer time must be positive")
            
            # Solve for semi-major axis using universal variable
            a = self._solve_lambert_universal(r1_mag, r2_mag, dtheta, transfer_time, mu, long_way)
            
            # Calculate eccentricity and other orbital elements
            f = 1 - a * (1 - math.cos(dtheta)) / r1_mag
            g = transfer_time - math.sqrt(a**3 / mu) * (dtheta - math.sin(dtheta))
            
            # Calculate velocity vectors
            v1 = (r2 - f * r1) / g
            
            f_dot = math.sqrt(mu / a) * math.tan(dtheta / 2) * ((1 - math.cos(dtheta)) / r1_mag - (1 - math.cos(dtheta)) / r2_mag) / 2
            g_dot = 1 - a * (1 - math.cos(dtheta)) / r2_mag
            
            v2 = f_dot * r1 + g_dot * v1
            
            # Calculate orbital parameters
            h_vec = np.cross(r1, v1)  # Angular momentum vector
            h = np.linalg.norm(h_vec)
            
            # Energy and eccentricity
            energy = np.dot(v1, v1) / 2 - mu / r1_mag
            ecc_vec = np.cross(v1, h_vec) / mu - r1 / r1_mag
            eccentricity = np.linalg.norm(ecc_vec)
            
            # Delta-V calculation
            v1_circular = math.sqrt(mu / r1_mag)
            v2_circular = math.sqrt(mu / r2_mag)
            delta_v1 = np.linalg.norm(v1) - v1_circular
            delta_v2 = abs(v2_circular - np.linalg.norm(v2))
            delta_v_total = abs(delta_v1) + abs(delta_v2)
            
            # Fuel efficiency calculation
            fuel_efficiency = max(0, 100 * (1 - delta_v_total / 15000))
            
            return {
                'v1': v1.tolist(),
                'v2': v2.tolist(),
                'semi_major_axis': a,
                'eccentricity': eccentricity,
                'delta_v_total': delta_v_total,
                'delta_v1': delta_v1,
                'delta_v2': delta_v2,
                'transfer_time': transfer_time,
                'fuel_efficiency': fuel_efficiency,
                'angular_momentum': h,
                'energy': energy,
                'trajectory_type': 'lambert'
            }
            
        except Exception as e:
            raise Exception(f"Lambert solver failed: {str(e)}")
    
    def _solve_lambert_universal(self, r1, r2, dtheta, t, mu, long_way=False):
        """Solve Lambert's problem using universal variables"""
        
        # Initial guess for semi-major axis
        c = math.sqrt(r1**2 + r2**2 - 2*r1*r2*math.cos(dtheta))
        s = (r1 + r2 + c) / 2
        a_min = s / 2
        
        # Initial guess
        if t < math.pi * math.sqrt(2 * s**3 / (8 * mu)):
            a_guess = a_min
        else:
            a_guess = a_min * 1.1
        
        # Newton-Raphson iteration to solve for semi-major axis
        a = a_guess
        for i in range(self.MAX_ITERATIONS):
            alpha = 2 * math.asin(math.sqrt(s / (2 * a)))
            beta = 2 * math.asin(math.sqrt((s - c) / (2 * a)))
            
            if long_way:
                alpha = 2 * math.pi - alpha
            
            t_calculated = math.sqrt(a**3 / mu) * (alpha - beta - (math.sin(alpha) - math.sin(beta)))
            
            # Check convergence
            if abs(t_calculated - t) < self.TOLERANCE:
                return a
            
            # Newton-Raphson update
            dt_da = (3/2) * math.sqrt(a / mu) * (alpha - beta - (math.sin(alpha) - math.sin(beta)))
            dt_da += math.sqrt(a**3 / mu) * (1/math.sqrt(a)) * (math.cos(alpha) - math.cos(beta))
            
            if abs(dt_da) < self.TOLERANCE:
                break
                
            a = a - (t_calculated - t) / dt_da
            
            # Ensure positive semi-major axis
            a = max(a, a_min * 0.9)
        
        return a