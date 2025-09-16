"""
ODIN Threat Detection & Risk Assessment Service
Monitors and analyzes various space threats for mission planning
"""

import numpy as np
import random
from datetime import datetime, timedelta

class ThreatMonitor:
    """Threat detection and risk assessment service"""
    
    def __init__(self):
        self.debris_database_size = 15000  # Simulated debris objects
        self.radiation_zones = [
            {'name': 'Van Allen Inner Belt', 'altitude_range': [200, 5000], 'intensity': 'high'},
            {'name': 'Van Allen Outer Belt', 'altitude_range': [13000, 60000], 'intensity': 'medium'},
            {'name': 'Solar Particle Events', 'altitude_range': [0, 100000], 'intensity': 'variable'}
        ]
    
    def analyze_debris_risk(self, trajectory, start_time, end_time):
        """Analyze space debris collision risk along trajectory"""
        try:
            # Simulate debris tracking (in reality would use NASA CARA data)
            high_risk_objects = []
            collision_probabilities = []
            
            # Generate simulated debris encounters
            num_encounters = random.randint(3, 12)
            
            for i in range(num_encounters):
                debris_obj = {
                    'object_id': f"DEBRIS_{random.randint(10000, 99999)}",
                    'closest_approach_time': start_time + timedelta(
                        seconds=random.uniform(0, (end_time - start_time).total_seconds())
                    ),
                    'miss_distance': random.uniform(50, 5000),  # meters
                    'relative_velocity': random.uniform(1000, 15000),  # m/s
                    'object_size': random.uniform(0.1, 2.0),  # meters
                    'collision_probability': random.uniform(1e-8, 1e-4)
                }
                
                if debris_obj['collision_probability'] > 1e-6:
                    high_risk_objects.append(debris_obj)
                
                collision_probabilities.append({
                    'time': debris_obj['closest_approach_time'].isoformat(),
                    'probability': debris_obj['collision_probability'],
                    'object_id': debris_obj['object_id']
                })
            
            # Generate avoidance maneuvers if needed
            avoidance_options = []
            if high_risk_objects:
                avoidance_options = [
                    {
                        'maneuver_type': 'radial_burn',
                        'delta_v': random.uniform(0.5, 5.0),
                        'execution_time': obj['closest_approach_time'] - timedelta(hours=2),
                        'risk_reduction': random.uniform(0.8, 0.99)
                    }
                    for obj in high_risk_objects[:3]  # Limit to top 3 risks
                ]
            
            return {
                'objects': high_risk_objects,
                'collision_probs': collision_probabilities,
                'avoidance_options': avoidance_options,
                'peak_risk_time': max(collision_probabilities, key=lambda x: x['probability'])['time'] if collision_probabilities else None,
                'total_risk_score': sum(p['probability'] for p in collision_probabilities) * 1e6
            }
            
        except Exception as e:
            raise Exception(f"Debris risk analysis failed: {str(e)}")
    
    def calculate_radiation_exposure(self, trajectory):
        """Calculate radiation exposure for given trajectory"""
        try:
            # Simplified radiation calculation
            total_dose = 0
            high_radiation_zones = []
            
            # Simulate trajectory points
            if isinstance(trajectory, dict) and 'waypoints' in trajectory:
                waypoints = trajectory['waypoints']
            else:
                # Generate sample waypoints if not provided
                waypoints = [
                    {'position': [7000000, 0, 0], 'time': 0},
                    {'position': [20000000, 15000000, 0], 'time': 86400},
                    {'position': [384400000, 0, 0], 'time': 259200}  # 3 days
                ]
            
            for point in waypoints:
                position = point['position']
                altitude = np.linalg.norm(position) - 6371000  # Altitude above Earth surface
                
                # Check radiation zones
                dose_rate = self._calculate_dose_rate(altitude)
                exposure_time = 3600  # 1 hour segments
                total_dose += dose_rate * exposure_time
                
                if dose_rate > 0.1:  # High radiation threshold
                    high_radiation_zones.append({
                        'position': position,
                        'altitude': altitude,
                        'dose_rate': dose_rate,
                        'zone_type': self._identify_radiation_zone(altitude)
                    })
            
            # Protection recommendations
            protection_measures = []
            if total_dose > 100:  # mSv
                protection_measures.append("Implement radiation shielding")
                protection_measures.append("Minimize time in high-radiation zones")
            
            crew_safety = 'safe'
            if total_dose > 500:
                crew_safety = 'critical'
            elif total_dose > 200:
                crew_safety = 'elevated_risk'
            
            return {
                'total_dose': total_dose,
                'dose_rate': total_dose / (3 * 24),  # Average per hour
                'high_radiation_zones': high_radiation_zones,
                'protection_measures': protection_measures,
                'crew_safety': crew_safety
            }
            
        except Exception as e:
            raise Exception(f"Radiation exposure calculation failed: {str(e)}")
    
    def predict_comm_blackouts(self, trajectory, start_time, end_time):
        """Predict communication blackout periods"""
        try:
            blackout_periods = []
            
            # Simulate communication blackouts
            duration = (end_time - start_time).total_seconds()
            
            # Lunar occultation periods
            if duration > 12 * 3600:  # More than 12 hours
                blackout_periods.append({
                    'type': 'lunar_occultation',
                    'start': start_time + timedelta(hours=24),
                    'end': start_time + timedelta(hours=25.5),
                    'duration': 5400,  # 1.5 hours
                    'cause': 'Moon blocking Earth communication'
                })
            
            # Solar radio blackouts
            if random.random() > 0.7:  # 30% chance
                blackout_periods.append({
                    'type': 'solar_radio_blackout',
                    'start': start_time + timedelta(hours=random.uniform(6, 48)),
                    'end': start_time + timedelta(hours=random.uniform(6, 48) + random.uniform(0.5, 4)),
                    'duration': random.uniform(1800, 14400),  # 30 min to 4 hours
                    'cause': 'Solar flare radio interference'
                })
            
            return blackout_periods
            
        except Exception as e:
            raise Exception(f"Communication blackout prediction failed: {str(e)}")
    
    def calculate_overall_risk(self, threats):
        """Calculate overall mission risk assessment"""
        try:
            risk_factors = {}
            total_risk_score = 0
            
            # Solar activity risk
            solar_data = threats.get('solar_activity', {})
            solar_risk = min(solar_data.get('risk_level', 0.1) * 100, 100)
            risk_factors['solar_activity'] = solar_risk
            total_risk_score += solar_risk * 0.3
            
            # Debris risk
            debris_data = threats.get('space_debris', {})
            debris_risk = min(debris_data.get('total_risk_score', 0) * 10, 100)
            risk_factors['space_debris'] = debris_risk
            total_risk_score += debris_risk * 0.4
            
            # Radiation risk
            radiation_data = threats.get('radiation_exposure', {})
            crew_safety = radiation_data.get('crew_safety', 'safe')
            radiation_risk = {'safe': 10, 'elevated_risk': 50, 'critical': 90}.get(crew_safety, 10)
            risk_factors['radiation'] = radiation_risk
            total_risk_score += radiation_risk * 0.3
            
            # Overall assessment
            if total_risk_score < 20:
                risk_level = 'low'
            elif total_risk_score < 50:
                risk_level = 'medium'
            elif total_risk_score < 75:
                risk_level = 'high'
            else:
                risk_level = 'critical'
            
            return {
                'overall_score': min(total_risk_score, 100),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'confidence': random.uniform(0.75, 0.95)
            }
            
        except Exception as e:
            raise Exception(f"Overall risk calculation failed: {str(e)}")
    
    def generate_recommendations(self, threats):
        """Generate threat mitigation recommendations"""
        recommendations = []
        
        # Solar activity recommendations
        solar_data = threats.get('solar_activity', {})
        if solar_data.get('risk_level', 0) > 0.5:
            recommendations.append("Monitor solar activity forecasts closely")
            recommendations.append("Consider delaying launch if major solar storm predicted")
        
        # Debris recommendations
        debris_data = threats.get('space_debris', {})
        if debris_data.get('total_risk_score', 0) > 0.01:
            recommendations.append("Implement debris avoidance maneuvers")
            recommendations.append("Increase tracking frequency during high-risk periods")
        
        # Radiation recommendations
        radiation_data = threats.get('radiation_exposure', {})
        if radiation_data.get('crew_safety') != 'safe':
            recommendations.append("Enhance radiation shielding")
            recommendations.append("Minimize crew EVA activities during transit")
        
        return recommendations
    
    def identify_critical_periods(self, threats, start_time, end_time):
        """Identify critical time periods with elevated risk"""
        critical_periods = []
        
        # Add debris high-risk periods
        debris_data = threats.get('space_debris', {})
        if debris_data.get('peak_risk_time'):
            critical_periods.append({
                'start': debris_data['peak_risk_time'],
                'type': 'debris_encounter',
                'severity': 'high'
            })
        
        # Add communication blackouts
        comm_data = threats.get('communication_blackouts', [])
        for blackout in comm_data:
            critical_periods.append({
                'start': blackout['start'].isoformat() if hasattr(blackout['start'], 'isoformat') else blackout['start'],
                'end': blackout['end'].isoformat() if hasattr(blackout['end'], 'isoformat') else blackout['end'],
                'type': 'communication_blackout',
                'severity': 'medium'
            })
        
        return critical_periods
    
    def _calculate_dose_rate(self, altitude):
        """Calculate radiation dose rate at given altitude"""
        # Simplified radiation model
        if 200 <= altitude <= 5000:  # Van Allen inner belt
            return 0.5 + (altitude - 200) / 4800 * 2.0  # 0.5 to 2.5 mSv/hr
        elif 13000 <= altitude <= 60000:  # Van Allen outer belt
            return 0.1 + (altitude - 13000) / 47000 * 0.8  # 0.1 to 0.9 mSv/hr
        else:
            return 0.01  # Background radiation
    
    def _identify_radiation_zone(self, altitude):
        """Identify which radiation zone the altitude falls into"""
        for zone in self.radiation_zones:
            if zone['altitude_range'][0] <= altitude <= zone['altitude_range'][1]:
                return zone['name']
        return 'Interplanetary space'
    
    def track_orbital_debris(self, trajectory, time_window):
        """Track orbital debris along trajectory"""
        return self.analyze_debris_risk(trajectory, 
                                      datetime.utcnow(), 
                                      datetime.utcnow() + timedelta(hours=time_window))
    
    def calculate_detailed_radiation_exposure(self, trajectory, crew_size, mission_duration):
        """Calculate detailed radiation exposure analysis"""
        base_result = self.calculate_radiation_exposure(trajectory)
        
        # Adjust for crew size and mission duration
        crew_factor = 1.0 + (crew_size - 1) * 0.1  # Slight increase for larger crews
        duration_factor = mission_duration / 3.0  # Normalized to 3 days
        
        adjusted_dose = base_result['total_dose'] * duration_factor * crew_factor
        
        return {
            **base_result,
            'total_dose': adjusted_dose,
            'crew_adjusted_dose': adjusted_dose / max(crew_size, 1)
        }