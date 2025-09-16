"""
Space Weather Database Model
"""

from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from database import db

class SpaceWeather(db.Model):
    """Historical space weather data model"""
    __tablename__ = 'space_weather'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False)
    solar_flux = db.Column(db.Float)  # Solar flux index
    geomagnetic_index = db.Column(db.Float)  # Kp index
    solar_events = db.Column(JSON)  # Solar flares, CME events
    radiation_level = db.Column(db.Float)  # Background radiation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'solar_flux': self.solar_flux,
            'geomagnetic_index': self.geomagnetic_index,
            'solar_events': self.solar_events,
            'radiation_level': self.radiation_level,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }