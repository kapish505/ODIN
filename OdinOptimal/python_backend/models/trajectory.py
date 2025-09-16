"""
Trajectory Database Model
"""

from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from database import db

class Trajectory(db.Model):
    """Calculated orbital trajectories model"""
    __tablename__ = 'trajectories'
    
    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'))
    trajectory_type = db.Column(db.String(50), nullable=False)  # hohmann, bi_elliptic, lambert
    start_position = db.Column(JSON)  # [x, y, z] coordinates
    end_position = db.Column(JSON)   # [x, y, z] coordinates
    waypoints = db.Column(JSON)      # Array of trajectory points
    delta_v_total = db.Column(db.Float)  # Total velocity change required
    transfer_time = db.Column(db.Float)  # Time in seconds
    fuel_efficiency = db.Column(db.Float)  # Efficiency score 0-100
    safety_score = db.Column(db.Float)     # Safety rating 0-100
    is_optimal = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'mission_id': self.mission_id,
            'trajectory_type': self.trajectory_type,
            'start_position': self.start_position,
            'end_position': self.end_position,
            'waypoints': self.waypoints,
            'delta_v_total': self.delta_v_total,
            'transfer_time': self.transfer_time,
            'fuel_efficiency': self.fuel_efficiency,
            'safety_score': self.safety_score,
            'is_optimal': self.is_optimal,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }