"""
Mission Management API Endpoints
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models.mission import Mission
from database import db

missions_bp = Blueprint('missions', __name__)

@missions_bp.route('/create', methods=['POST'])
def create_mission():
    """Create a new mission"""
    try:
        data = request.get_json()
        
        mission = Mission(
            name=data.get('name'),
            launch_date=datetime.fromisoformat(data.get('launch_date')),
            arrival_date=datetime.fromisoformat(data.get('arrival_date')) if data.get('arrival_date') else None,
            fuel_capacity=data.get('fuel_capacity', 1000.0),
            crew_size=data.get('crew_size', 0),
            trajectory_data=data.get('trajectory_data', {}),
        )
        
        db.session.add(mission)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'mission': mission.to_dict(),
            'message': 'Mission created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@missions_bp.route('/<int:mission_id>/status', methods=['GET'])
def get_mission_status(mission_id):
    """Get mission status"""
    try:
        mission = Mission.query.get_or_404(mission_id)
        
        # Calculate mission progress
        now = datetime.utcnow()
        if mission.launch_date and mission.arrival_date:
            total_duration = (mission.arrival_date - mission.launch_date).total_seconds()
            elapsed = (now - mission.launch_date).total_seconds()
            progress = min(max(elapsed / total_duration * 100, 0), 100) if total_duration > 0 else 0
        else:
            progress = 0
            
        return jsonify({
            'success': True,
            'mission': mission.to_dict(),
            'progress': progress,
            'fuel_efficiency': ((mission.fuel_capacity - mission.fuel_used) / mission.fuel_capacity * 100) if mission.fuel_capacity > 0 else 0
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@missions_bp.route('/', methods=['GET'])
def list_missions():
    """List all missions"""
    try:
        missions = Mission.query.order_by(Mission.created_at.desc()).all()
        return jsonify({
            'success': True,
            'missions': [mission.to_dict() for mission in missions],
            'count': len(missions)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@missions_bp.route('/<int:mission_id>', methods=['PUT'])
def update_mission(mission_id):
    """Update mission details"""
    try:
        mission = Mission.query.get_or_404(mission_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'status' in data:
            mission.status = data['status']
        if 'fuel_used' in data:
            mission.fuel_used = data['fuel_used']
        if 'trajectory_data' in data:
            mission.trajectory_data = data['trajectory_data']
        if 'threat_events' in data:
            mission.threat_events = data['threat_events']
        if 'decisions_log' in data:
            mission.decisions_log = data['decisions_log']
            
        mission.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'mission': mission.to_dict(),
            'message': 'Mission updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400