"""
Trajectory Planning API Endpoints
"""

from flask import Blueprint, request, jsonify
import numpy as np
from services.trajectory_engine import TrajectoryEngine
from services.lambert_solver import LambertSolver

trajectory_bp = Blueprint('trajectory', __name__)

@trajectory_bp.route('/calculate', methods=['POST'])
def calculate_trajectory():
    """Calculate optimal trajectory between two points"""
    try:
        data = request.get_json()
        
        # Extract parameters
        start_position = data.get('start_position')  # [x, y, z] in km
        end_position = data.get('end_position')      # [x, y, z] in km
        transfer_time = data.get('transfer_time', 3.0 * 24 * 3600)  # seconds (default 3 days)
        method = data.get('method', 'hohmann')  # hohmann, bi_elliptic, lambert
        
        trajectory_engine = TrajectoryEngine()
        
        if method == 'lambert':
            # Use Lambert's problem solver
            lambert = LambertSolver()
            result = lambert.solve(start_position, end_position, transfer_time)
        elif method == 'hohmann':
            # Hohmann transfer optimization
            result = trajectory_engine.calculate_hohmann_transfer(start_position, end_position)
        elif method == 'bi_elliptic':
            # Bi-elliptic transfer
            result = trajectory_engine.calculate_bi_elliptic_transfer(start_position, end_position)
        else:
            return jsonify({
                'success': False,
                'error': f'Unknown trajectory method: {method}'
            }), 400
            
        return jsonify({
            'success': True,
            'trajectory': result,
            'method': method,
            'delta_v_total': result.get('delta_v_total', 0),
            'transfer_time': result.get('transfer_time', transfer_time),
            'fuel_efficiency': result.get('fuel_efficiency', 0)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@trajectory_bp.route('/optimize', methods=['POST'])
def optimize_trajectory():
    """Multi-objective trajectory optimization"""
    try:
        data = request.get_json()
        
        # Optimization criteria weights
        weights = {
            'fuel_efficiency': data.get('fuel_weight', 0.4),
            'travel_time': data.get('time_weight', 0.3),
            'safety_score': data.get('safety_weight', 0.3)
        }
        
        trajectory_engine = TrajectoryEngine()
        result = trajectory_engine.multi_objective_optimization(
            start_pos=data.get('start_position'),
            end_pos=data.get('end_position'),
            constraints=data.get('constraints', {}),
            weights=weights
        )
        
        return jsonify({
            'success': True,
            'optimal_trajectory': result,
            'alternatives': result.get('alternatives', []),
            'trade_offs': result.get('trade_offs', {})
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@trajectory_bp.route('/validate', methods=['POST'])
def validate_trajectory():
    """Validate trajectory for safety and feasibility"""
    try:
        data = request.get_json()
        trajectory_data = data.get('trajectory')
        
        trajectory_engine = TrajectoryEngine()
        validation_result = trajectory_engine.validate_trajectory(trajectory_data)
        
        return jsonify({
            'success': True,
            'is_valid': validation_result['is_valid'],
            'issues': validation_result.get('issues', []),
            'recommendations': validation_result.get('recommendations', []),
            'safety_score': validation_result.get('safety_score', 0)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400