"""
AI Decision Engine API Endpoints
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from services.ai_decision_engine import AIDecisionEngine
from models.ai_decision import AIDecision
from database import db

decisions_bp = Blueprint('decisions', __name__)

@decisions_bp.route('/analyze', methods=['POST'])
def analyze_decision():
    """Analyze situation and generate AI decision"""
    try:
        data = request.get_json()
        
        # Extract decision context
        context = {
            'mission_id': data.get('mission_id'),
            'current_trajectory': data.get('current_trajectory'),
            'threat_data': data.get('threats', {}),
            'mission_constraints': data.get('constraints', {}),
            'optimization_criteria': data.get('criteria', {
                'fuel_efficiency': 0.4,
                'travel_time': 0.3,
                'safety': 0.3
            })
        }
        
        ai_engine = AIDecisionEngine()
        decision_result = ai_engine.analyze_and_decide(context)
        
        # Log the decision
        ai_decision = AIDecision(
            mission_id=context['mission_id'],
            decision_type='trajectory_optimization',
            context_data=context,
            decision_data=decision_result,
            reasoning=decision_result.get('reasoning', ''),
            confidence_score=decision_result.get('confidence', 0.0),
            timestamp=datetime.utcnow()
        )
        
        db.session.add(ai_decision)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'decision': decision_result,
            'decision_id': ai_decision.id,
            'alternatives': decision_result.get('alternatives', []),
            'trade_offs': decision_result.get('trade_offs', {}),
            'reasoning': decision_result.get('reasoning', ''),
            'confidence': decision_result.get('confidence', 0.0)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@decisions_bp.route('/history', methods=['GET'])
def get_decision_history():
    """Get AI decision history"""
    try:
        mission_id = request.args.get('mission_id')
        limit = int(request.args.get('limit', 50))
        
        query = AIDecision.query
        if mission_id:
            query = query.filter_by(mission_id=mission_id)
            
        decisions = query.order_by(AIDecision.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'decisions': [decision.to_dict() for decision in decisions],
            'count': len(decisions)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@decisions_bp.route('/replan', methods=['POST'])
def trigger_replanning():
    """Trigger autonomous replanning"""
    try:
        data = request.get_json()
        
        context = {
            'mission_id': data.get('mission_id'),
            'trigger_reason': data.get('reason', 'manual_trigger'),
            'current_situation': data.get('situation', {}),
            'emergency_level': data.get('emergency_level', 'low')  # low, medium, high, critical
        }
        
        ai_engine = AIDecisionEngine()
        replan_result = ai_engine.autonomous_replan(context)
        
        # Log replanning decision
        ai_decision = AIDecision(
            mission_id=context['mission_id'],
            decision_type='autonomous_replan',
            context_data=context,
            decision_data=replan_result,
            reasoning=replan_result.get('reasoning', ''),
            confidence_score=replan_result.get('confidence', 0.0),
            timestamp=datetime.utcnow()
        )
        
        db.session.add(ai_decision)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'replan_result': replan_result,
            'new_trajectory': replan_result.get('new_trajectory'),
            'estimated_impact': replan_result.get('impact_analysis', {}),
            'implementation_steps': replan_result.get('implementation_steps', []),
            'approval_required': replan_result.get('requires_approval', False)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@decisions_bp.route('/explain/<int:decision_id>', methods=['GET'])
def explain_decision(decision_id):
    """Get detailed explanation of a specific decision"""
    try:
        decision = AIDecision.query.get_or_404(decision_id)
        
        ai_engine = AIDecisionEngine()
        explanation = ai_engine.generate_detailed_explanation(decision.to_dict())
        
        return jsonify({
            'success': True,
            'decision': decision.to_dict(),
            'explanation': explanation,
            'reasoning_tree': explanation.get('reasoning_tree', []),
            'alternative_analysis': explanation.get('alternatives_considered', [])
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400