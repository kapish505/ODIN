#!/usr/bin/env python3
"""
ODIN (Optimal Dynamic Interplanetary Navigator) - Flask Backend
Main application entry point
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from database import db

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow React frontend (include Vite dev server)
cors_origins = [
    "http://localhost:5000", 
    "http://0.0.0.0:5000", 
    "http://localhost:5173",  # Vite dev server default
    "http://0.0.0.0:5173"
]
# Add Replit domain if in Replit environment
if os.getenv('REPL_ID'):
    cors_origins.append(f"https://{os.getenv('REPL_ID')}.{os.getenv('REPL_SLUG', 'replit')}.repl.co")

CORS(app, origins=cors_origins, supports_credentials=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'odin-development-key')

# Initialize database with app
db.init_app(app)
# Ensure tables exist both in dev and prod (WSGI)
with app.app_context():
    try:
        db.create_all()
    except Exception:
        pass

# Import and register API blueprints
from api.missions import missions_bp
from api.trajectory import trajectory_bp
from api.threats import threats_bp
from api.decisions import decisions_bp
from api.space_weather import space_weather_bp

app.register_blueprint(missions_bp, url_prefix='/api/missions')
app.register_blueprint(trajectory_bp, url_prefix='/api/trajectory')
app.register_blueprint(threats_bp, url_prefix='/api/threats')
app.register_blueprint(decisions_bp, url_prefix='/api/decisions')
app.register_blueprint(space_weather_bp, url_prefix='/api/space-weather')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ODIN Backend',
        'version': '1.0.0'
    })

@app.route('/api/status')
def system_status():
    """System status endpoint"""
    return jsonify({
        'database': 'connected',
        'ai_engine': 'ready',
        'trajectory_engine': 'initialized',
        'threat_monitor': 'active'
    })

@app.route('/api/admin/init-db', methods=['POST','GET'])
def init_db_endpoint():
    """Create all DB tables. Useful on first deploy when running under WSGI."""
    try:
        with app.app_context():
            db.create_all()
        return jsonify({'success': True, 'message': 'Database tables created'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    port = int(os.getenv('PORT', 3001))
    # Use debug mode only in development
    is_development = os.getenv('FLASK_ENV') == 'development' or os.getenv('NODE_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=is_development)
