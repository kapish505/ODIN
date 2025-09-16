"""
ODIN Trajectory Planning Engine
Implements orbital mechanics calculations for spacecraft trajectory planning
"""

import numpy as np
from scipy.optimize import minimize
import math

class TrajectoryEngine:
    """Core trajectory planning and optimization engine"""
    
    def __init__(self):
        # Orbital mechanics constants
        self.MU_EARTH = 3.986004418e14  # Earth's gravitational parameter (m³/s²)
        self.MU_MOON = 4.9048695e12     # Moon's gravitational parameter (m³/s²)
        self.EARTH_RADIUS = 6371000     # Earth radius (m)
        self.MOON_RADIUS = 1737400      # Moon radius (m)
        self.EARTH_MOON_DISTANCE = 384400000  # Average Earth-Moon distance (m)
    
    def calculate_hohmann_transfer(self, start_pos, end_pos):
        """Calculate Hohmann transfer orbit between two positions"""
        try:
            # Convert positions to numpy arrays
            r1 = np.array(start_pos)
            r2 = np.array(end_pos)
            
            # Calculate orbital radii
            r1_mag = np.linalg.norm(r1)
            r2_mag = np.linalg.norm(r2)
            
            # Semi-major axis of transfer orbit
            a_transfer = (r1_mag + r2_mag) / 2
            
            # Velocities at transfer points
            v1_transfer = math.sqrt(self.MU_EARTH * (2/r1_mag - 1/a_transfer))
            v2_transfer = math.sqrt(self.MU_EARTH * (2/r2_mag - 1/a_transfer))
            
            # Circular velocities at start and end
            v1_circular = math.sqrt(self.MU_EARTH / r1_mag)
            v2_circular = math.sqrt(self.MU_EARTH / r2_mag)
            
            # Delta-V calculations
            delta_v1 = abs(v1_transfer - v1_circular)
            delta_v2 = abs(v2_circular - v2_transfer)
            delta_v_total = delta_v1 + delta_v2
            
            # Transfer time (half orbit period)
            transfer_time = math.pi * math.sqrt(a_transfer**3 / self.MU_EARTH)
            
            # Fuel efficiency calculation (inverse of delta-V)
            fuel_efficiency = max(0, 100 * (1 - delta_v_total / 15000))  # Normalized
            
            return {
                'delta_v_total': delta_v_total,
                'delta_v1': delta_v1,
                'delta_v2': delta_v2,
                'transfer_time': transfer_time,
                'fuel_efficiency': fuel_efficiency,
                'semi_major_axis': a_transfer,
                'trajectory_type': 'hohmann'
            }
            
        except Exception as e:
            raise Exception(f"Hohmann transfer calculation failed: {str(e)}")
    
    def calculate_bi_elliptic_transfer(self, start_pos, end_pos):
        """Calculate bi-elliptic transfer orbit"""
        try:
            r1 = np.linalg.norm(start_pos)
            r2 = np.linalg.norm(end_pos)
            
            # Optimal intermediate radius (typically 2-3 times the larger radius)
            r_intermediate = 2.5 * max(r1, r2)
            
            # First transfer (to intermediate orbit)
            a1 = (r1 + r_intermediate) / 2
            v1_transfer1 = math.sqrt(self.MU_EARTH * (2/r1 - 1/a1))
            v1_circular = math.sqrt(self.MU_EARTH / r1)
            delta_v1 = abs(v1_transfer1 - v1_circular)
            time1 = math.pi * math.sqrt(a1**3 / self.MU_EARTH)
            
            # Second transfer (from intermediate to final orbit)
            a2 = (r_intermediate + r2) / 2
            v_intermediate1 = math.sqrt(self.MU_EARTH * (2/r_intermediate - 1/a1))
            v_intermediate2 = math.sqrt(self.MU_EARTH * (2/r_intermediate - 1/a2))
            delta_v2 = abs(v_intermediate2 - v_intermediate1)
            time2 = math.pi * math.sqrt(a2**3 / self.MU_EARTH)
            
            # Final velocity change
            v2_transfer = math.sqrt(self.MU_EARTH * (2/r2 - 1/a2))
            v2_circular = math.sqrt(self.MU_EARTH / r2)
            delta_v3 = abs(v2_circular - v2_transfer)
            
            delta_v_total = delta_v1 + delta_v2 + delta_v3
            transfer_time = time1 + time2
            fuel_efficiency = max(0, 100 * (1 - delta_v_total / 18000))
            
            return {
                'delta_v_total': delta_v_total,
                'delta_v1': delta_v1,
                'delta_v2': delta_v2,
                'delta_v3': delta_v3,
                'transfer_time': transfer_time,
                'fuel_efficiency': fuel_efficiency,
                'intermediate_radius': r_intermediate,
                'trajectory_type': 'bi_elliptic'
            }
            
        except Exception as e:
            raise Exception(f"Bi-elliptic transfer calculation failed: {str(e)}")
    
    def multi_objective_optimization(self, start_pos, end_pos, constraints, weights):
        """Multi-objective trajectory optimization"""
        try:
            # Calculate different transfer options
            hohmann = self.calculate_hohmann_transfer(start_pos, end_pos)
            bi_elliptic = self.calculate_bi_elliptic_transfer(start_pos, end_pos)
            
            alternatives = [hohmann, bi_elliptic]
            
            # Score each alternative based on weighted criteria
            best_score = -1
            optimal_trajectory = None
            
            for trajectory in alternatives:
                # Normalize metrics (0-1 scale)
                fuel_score = trajectory['fuel_efficiency'] / 100
                time_score = max(0, 1 - trajectory['transfer_time'] / (7 * 24 * 3600))  # Normalize to 7 days
                safety_score = 0.8  # Simplified safety score
                
                # Calculate weighted score
                total_score = (
                    weights['fuel_efficiency'] * fuel_score +
                    weights['travel_time'] * time_score +
                    weights['safety_score'] * safety_score
                )
                
                trajectory['optimization_score'] = total_score
                
                if total_score > best_score:
                    best_score = total_score
                    optimal_trajectory = trajectory
            
            return {
                'optimal_trajectory': optimal_trajectory,
                'alternatives': alternatives,
                'trade_offs': {
                    'best_fuel_efficiency': max(alt['fuel_efficiency'] for alt in alternatives),
                    'shortest_time': min(alt['transfer_time'] for alt in alternatives),
                    'optimization_weights': weights
                }
            }
            
        except Exception as e:
            raise Exception(f"Multi-objective optimization failed: {str(e)}")
    
    def validate_trajectory(self, trajectory_data):
        """Validate trajectory for safety and feasibility"""
        try:
            issues = []
            recommendations = []
            safety_score = 100
            
            # Check delta-V requirements
            if trajectory_data.get('delta_v_total', 0) > 20000:  # m/s
                issues.append("Excessive delta-V requirement")
                safety_score -= 30
                recommendations.append("Consider alternative trajectory with lower fuel requirements")
            
            # Check transfer time
            if trajectory_data.get('transfer_time', 0) > 10 * 24 * 3600:  # 10 days
                issues.append("Extended transfer time increases risk")
                safety_score -= 20
                recommendations.append("Optimize for shorter transfer time")
            
            # Check fuel efficiency
            if trajectory_data.get('fuel_efficiency', 100) < 50:
                issues.append("Low fuel efficiency")
                safety_score -= 25
                recommendations.append("Improve trajectory optimization")
            
            return {
                'is_valid': safety_score >= 50,
                'issues': issues,
                'recommendations': recommendations,
                'safety_score': max(0, safety_score)
            }
            
        except Exception as e:
            raise Exception(f"Trajectory validation failed: {str(e)}")