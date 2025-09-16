"""
Threat Event Database Model
"""

from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from database import db

class ThreatEvent(db.Model):
    """Detected threat events model"""
    __tablename__ = 'threat_events'
    
    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'))
    threat_type = db.Column(db.String(100), nullable=False)  # solar_flare, debris, radiation
    severity = db.Column(db.String(20), default='low')  # low, medium, high, critical
    probability = db.Column(db.Float, default=0.0)  # 0.0 to 1.0
    impact_data = db.Column(JSON)
    mitigation_options = db.Column(JSON)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    predicted_time = db.Column(db.DateTime)  # When the threat will occur
    resolved = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'mission_id': self.mission_id,
            'threat_type': self.threat_type,
            'severity': self.severity,
            'probability': self.probability,
            'impact_data': self.impact_data,
            'mitigation_options': self.mitigation_options,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'predicted_time': self.predicted_time.isoformat() if self.predicted_time else None,
            'resolved': self.resolved
        }