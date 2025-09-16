"""
Mission Database Model
"""

from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from database import db

class Mission(db.Model):
    """Mission tracking model"""
    __tablename__ = 'missions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    launch_date = db.Column(db.DateTime, nullable=False)
    arrival_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='planning')  # planning, active, completed, aborted
    trajectory_data = db.Column(JSON)
    threat_events = db.Column(JSON)
    decisions_log = db.Column(JSON)
    fuel_capacity = db.Column(db.Float, default=1000.0)  # kg
    fuel_used = db.Column(db.Float, default=0.0)  # kg
    crew_size = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'launch_date': self.launch_date.isoformat() if self.launch_date else None,
            'arrival_date': self.arrival_date.isoformat() if self.arrival_date else None,
            'status': self.status,
            'trajectory_data': self.trajectory_data,
            'threat_events': self.threat_events,
            'decisions_log': self.decisions_log,
            'fuel_capacity': self.fuel_capacity,
            'fuel_used': self.fuel_used,
            'crew_size': self.crew_size,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }