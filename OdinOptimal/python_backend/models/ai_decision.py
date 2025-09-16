"""
AI Decision Database Model
"""

from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from database import db

class AIDecision(db.Model):
    """AI decision logging model"""
    __tablename__ = 'ai_decisions'
    
    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'))
    decision_type = db.Column(db.String(100), nullable=False)
    context_data = db.Column(JSON)  # Input context for decision
    decision_data = db.Column(JSON)  # The actual decision made
    reasoning = db.Column(db.Text)  # AI's reasoning explanation
    confidence_score = db.Column(db.Float, default=0.0)  # 0.0 to 1.0
    alternatives_considered = db.Column(JSON)  # Other options evaluated
    trade_offs = db.Column(JSON)  # Trade-off analysis
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    implemented = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'mission_id': self.mission_id,
            'decision_type': self.decision_type,
            'context_data': self.context_data,
            'decision_data': self.decision_data,
            'reasoning': self.reasoning,
            'confidence_score': self.confidence_score,
            'alternatives_considered': self.alternatives_considered,
            'trade_offs': self.trade_offs,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'implemented': self.implemented
        }