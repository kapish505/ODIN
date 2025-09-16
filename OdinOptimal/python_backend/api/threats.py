"""
Threat Detection & Risk Assessment API Endpoints
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from services.threat_monitor import ThreatMonitor
from services.space_weather import SpaceWeatherService

threats_bp = Blueprint('threats', __name__)

@threats_bp.route('/analyze', methods=['POST'])
def analyze_threats():
    """Analyze current and predicted threats"""
    try:
        data = request.get_json()
        
        # Get mission trajectory and timeframe
        trajectory = data.get('trajectory')
        mission_id = data.get('mission_id')
        start_time = datetime.fromisoformat(data.get('start_time', datetime.utcnow().isoformat()))
        end_time = datetime.fromisoformat(data.get('end_time', (datetime.utcnow() + timedelta(days=3)).isoformat()))
        
        threat_monitor = ThreatMonitor()
        space_weather = SpaceWeatherService()
        
        # Analyze different threat types
        threats = {
            'solar_activity': space_weather.get_solar_activity_forecast(start_time, end_time),
            'space_debris': threat_monitor.analyze_debris_risk(trajectory, start_time, end_time),
            'radiation_exposure': threat_monitor.calculate_radiation_exposure(trajectory),
            'communication_blackouts': threat_monitor.predict_comm_blackouts(trajectory, start_time, end_time)
        }
        
        # Calculate overall risk score
        risk_assessment = threat_monitor.calculate_overall_risk(threats)
        
        return jsonify({
            'success': True,
            'threats': threats,
            'risk_assessment': risk_assessment,
            'recommendations': threat_monitor.generate_recommendations(threats),
            'critical_periods': threat_monitor.identify_critical_periods(threats, start_time, end_time)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@threats_bp.route('/solar-activity', methods=['GET'])
def get_solar_activity():
    """Get current solar activity data"""
    try:
        space_weather = SpaceWeatherService()
        
        # Get current solar data
        solar_data = space_weather.get_current_solar_activity()
        
        return jsonify({
            'success': True,
            'solar_flux': solar_data.get('solar_flux'),
            'geomagnetic_index': solar_data.get('geomagnetic_index'),
            'solar_events': solar_data.get('solar_events', []),
            'last_updated': solar_data.get('timestamp'),
            'forecast': space_weather.get_24h_forecast()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@threats_bp.route('/debris-tracking', methods=['POST'])
def track_debris():
    """Track space debris along trajectory"""
    try:
        data = request.get_json()
        trajectory = data.get('trajectory')
        time_window = data.get('time_window', 24)  # hours
        
        threat_monitor = ThreatMonitor()
        debris_analysis = threat_monitor.track_orbital_debris(trajectory, time_window)
        
        return jsonify({
            'success': True,
            'debris_objects': debris_analysis.get('objects', []),
            'collision_probabilities': debris_analysis.get('collision_probs', []),
            'avoidance_maneuvers': debris_analysis.get('avoidance_options', []),
            'highest_risk_period': debris_analysis.get('peak_risk_time')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@threats_bp.route('/radiation-exposure', methods=['POST'])
def calculate_radiation():
    """Calculate radiation exposure for given trajectory"""
    try:
        data = request.get_json()
        trajectory = data.get('trajectory')
        crew_size = data.get('crew_size', 0)
        mission_duration = data.get('duration', 3.0)  # days
        
        threat_monitor = ThreatMonitor()
        radiation_analysis = threat_monitor.calculate_detailed_radiation_exposure(
            trajectory, crew_size, mission_duration
        )
        
        return jsonify({
            'success': True,
            'total_dose': radiation_analysis.get('total_dose'),
            'dose_rate': radiation_analysis.get('dose_rate'),
            'critical_zones': radiation_analysis.get('high_radiation_zones', []),
            'protection_recommendations': radiation_analysis.get('protection_measures', []),
            'crew_safety_status': radiation_analysis.get('crew_safety', 'safe')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400