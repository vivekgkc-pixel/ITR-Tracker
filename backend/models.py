from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    pin = db.Column(db.String(4), nullable=False, default='1234')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class AssessmentYear(db.Model):
    __tablename__ = 'assessment_years'
    
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.String(10), unique=True, nullable=False)  # e.g., "2025-26"
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Staff(db.Model):
    __tablename__ = 'staff'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Client(db.Model):
    __tablename__ = 'clients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    pan = db.Column(db.String(10), nullable=False)
    assessment_year_id = db.Column(db.Integer, db.ForeignKey('assessment_years.id'))
    itr_type = db.Column(db.String(10))  # ITR-1 through ITR-6
    date_received = db.Column(db.Date)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    priority = db.Column(db.String(20))  # High, Medium, Low
    preparation_done = db.Column(db.Boolean, default=False)
    reviewed = db.Column(db.Boolean, default=False)
    filed = db.Column(db.Boolean, default=False)
    filing_date = db.Column(db.Date)
    acknowledgement_number = db.Column(db.String(20))
    contact_number = db.Column(db.String(20))
    remarks = db.Column(db.Text)
    document_path = db.Column(db.String(500))  # Path to uploaded document
    document_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assessment_year = db.relationship('AssessmentYear', backref='clients')
    staff = db.relationship('Staff', backref='clients')
    activity_logs = db.relationship('ActivityLog', backref='client', cascade='all, delete-orphan')
    notes = db.relationship('Note', backref='client', cascade='all, delete-orphan')

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    performed_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Settings(db.Model):
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Backup(db.Model):
    __tablename__ = 'backups'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
