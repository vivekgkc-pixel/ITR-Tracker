from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
from datetime import timedelta

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///itr_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 24)))

# Initialize extensions
CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','))
jwt = JWTManager(app)

# Import models and routes (will be created)
from models import db
from routes import api_bp

# Initialize database
db.init_app(app)
migrate = Migrate(app, db)

# Register blueprints
app.register_blueprint(api_bp, url_prefix='/api')

# Create tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
