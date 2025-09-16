"""
Centralized database configuration for ODIN system
"""

from flask_sqlalchemy import SQLAlchemy

# Single database instance to be shared across all models
db = SQLAlchemy()