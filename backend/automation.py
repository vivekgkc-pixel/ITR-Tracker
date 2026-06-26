"""
Automation scripts for ITR Tracker
- Automated backups
- Email notifications
- WhatsApp reminders
"""

import os
import json
import schedule
import time
from datetime import datetime, timedelta
from app import app, db
from models import Client, Backup
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# ==================== AUTOMATED BACKUP ====================

def create_automated_backup():
    """Create automated backup of all data"""
    with app.app_context():
        import requests
        
        # Call the backup API endpoint
        try:
            # For now, we'll create the backup directly
            backup_data = {
                'clients': [],
                'assessment_years': [],
                'staff': [],
                'backup_date': datetime.now().isoformat()
            }
            
            # Export clients
            for client in Client.query.all():
                backup_data['clients'].append({
                    'id': client.id,
                    'name': client.name,
                    'pan': client.pan,
                    'assessment_year_id': client.assessment_year_id,
                    'itr_type': client.itr_type,
                    'date_received': client.date_received.isoformat() if client.date_received else None,
                    'staff_id': client.staff_id,
                    'priority': client.priority,
                    'preparation_done': client.preparation_done,
                    'reviewed': client.reviewed,
                    'filed': client.filed,
                    'filing_date': client.filing_date.isoformat() if client.filing_date else None,
                    'acknowledgement_number': client.acknowledgement_number,
                    'contact_number': client.contact_number,
                    'remarks': client.remarks,
                    'document_name': client.document_name,
                    'created_at': client.created_at.isoformat()
                })
            
            # Export assessment years
            for ay in app.config['SQLALCHEMY'].session.query(AssessmentYear).all():
                backup_data['assessment_years'].append({
                    'id': ay.id,
                    'year': ay.year,
                    'is_active': ay.is_active
                })
            
            # Export staff
            for staff in app.config['SQLALCHEMY'].session.query(Staff).all():
                backup_data['staff'].append({
                    'id': staff.id,
                    'name': staff.name,
                    'email': staff.email,
                    'phone': staff.phone,
                    'is_active': staff.is_active
                })
            
            backup_folder = os.getenv('BACKUP_PATH', './backups')
            if not os.path.exists(backup_folder):
                os.makedirs(backup_folder)
            
            filename = f'auto_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            filepath = os.path.join(backup_folder, filename)
            
            with open(filepath, 'w') as f:
                json.dump(backup_data, f, indent=2)
            
            # Record backup in database
            backup = Backup(
                filename=filename,
                file_path=filepath,
                file_size=os.path.getsize(filepath)
            )
            db.session.add(backup)
            db.session.commit()
            
            # Clean old backups
            cleanup_old_backups(backup_folder)
            
            print(f"Backup created successfully: {filename}")
            
        except Exception as e:
            print(f"Backup failed: {str(e)}")

def cleanup_old_backups(backup_folder):
    """Remove backups older than retention period"""
    retention_days = int(os.getenv('BACKUP_RETENTION_DAYS', 30))
    cutoff_date = datetime.now() - timedelta(days=retention_days)
    
    for backup in Backup.query.filter(Backup.created_at < cutoff_date).all():
        if os.path.exists(backup.file_path):
            os.remove(backup.file_path)
        db.session.delete(backup)
    
    db.session.commit()
    print(f"Cleaned up backups older than {retention_days} days")

# ==================== EMAIL NOTIFICATIONS ====================

def send_email(to_email, subject, body):
    """Send email notification"""
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv('EMAIL_FROM')
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(
            os.getenv('EMAIL_HOST'),
            int(os.getenv('EMAIL_PORT', 587))
        )
        
        if os.getenv('EMAIL_USE_TLS', 'True') == 'True':
            server.starttls()
        
        server.login(
            os.getenv('EMAIL_USERNAME'),
            os.getenv('EMAIL_PASSWORD')
        )
        
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_filing_confirmation(client):
    """Send filing confirmation email to client"""
    subject = f"ITR Filing Confirmation - {client.name}"
    
    body = f"""
    <html>
    <body>
        <h2>ITR Filing Confirmation</h2>
        <p>Dear {client.name},</p>
        <p>We are pleased to inform you that your Income Tax Return for Assessment Year {client.assessment_year.year if client.assessment_year else 'N/A'} has been successfully filed.</p>
        
        <h3>Filing Details:</h3>
        <ul>
            <li><strong>PAN:</strong> {client.pan}</li>
            <li><strong>ITR Type:</strong> {client.itr_type or 'N/A'}</li>
            <li><strong>Filing Date:</strong> {client.filing_date.strftime('%d %B %Y') if client.filing_date else 'N/A'}</li>
            <li><strong>Acknowledgement Number:</strong> {client.acknowledgement_number or 'N/A'}</li>
        </ul>
        
        <p>Please keep this acknowledgement number safe for your records.</p>
        
        <p>Best regards,<br>ITR Tracker Team</p>
    </body>
    </html>
    """
    
    if client.contact_number:
        # Extract email from contact or use default
        send_email(client.contact_number, subject, body)

def send_pending_reminder(client):
    """Send reminder to client for pending documents"""
    subject = f"Reminder: Pending ITR Documents - {client.name}"
    
    body = f"""
    <html>
    <body>
        <h2>Pending ITR Documents Reminder</h2>
        <p>Dear {client.name},</p>
        <p>This is a friendly reminder that we are still awaiting your documents for ITR filing for Assessment Year {client.assessment_year.year if client.assessment_year else 'N/A'}.</p>
        
        <h3>Required Documents:</h3>
        <ul>
            <li>Form 16 / Salary Certificate</li>
            <li>Bank Statements</li>
            <li>Investment Proofs</li>
            <li>Other Income Documents</li>
        </ul>
        
        <p>Please submit your documents at your earliest convenience to avoid last-minute rush.</p>
        
        <p>Best regards,<br>ITR Tracker Team</p>
    </body>
    </html>
    """
    
    if client.contact_number:
        send_email(client.contact_number, subject, body)

# ==================== WHATSAPP REMINDERS ====================

def send_whatsapp_message(to_number, message):
    """Send WhatsApp message using Twilio"""
    try:
        client = Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN')
        )
        
        # Ensure number is in correct format
        if not to_number.startswith('+'):
            to_number = '+91' + to_number
        
        message = client.messages.create(
            body=message,
            from_=os.getenv('TWILIO_WHATSAPP_FROM'),
            to=f'whatsapp:{to_number}'
        )
        
        print(f"WhatsApp sent to {to_number}: {message.sid}")
        return True
        
    except Exception as e:
        print(f"Failed to send WhatsApp: {str(e)}")
        return False

def send_whatsapp_filing_confirmation(client):
    """Send WhatsApp filing confirmation"""
    message = f"""Dear {client.name}, your ITR for AY {client.assessment_year.year if client.assessment_year else 'N/A'} has been filed. Ack no: {client.acknowledgement_number or 'N/A'}. Thank you!"""
    
    if client.contact_number:
        send_whatsapp_message(client.contact_number, message)

def send_whatsapp_pending_reminder(client):
    """Send WhatsApp reminder for pending documents"""
    message = f"""Dear {client.name}, friendly reminder: We're still awaiting your ITR documents for AY {client.assessment_year.year if client.assessment_year else 'N/A'}. Please submit soon to avoid delays. Thank you!"""
    
    if client.contact_number:
        send_whatsapp_message(client.contact_number, message)

# ==================== AUTOMATION SCHEDULER ====================

def run_automations():
    """Run all scheduled automations"""
    with app.app_context():
        # Send reminders to pending clients
        pending_clients = Client.query.filter_by(preparation_done=False).all()
        for client in pending_clients:
            if client.contact_number:
                send_whatsapp_pending_reminder(client)
                send_pending_reminder(client)
        
        print(f"Sent reminders to {len(pending_clients)} pending clients")

def schedule_automations():
    """Schedule all automation tasks"""
    # Daily backup at 2 AM
    schedule.every().day.at("02:00").do(create_automated_backup)
    
    # Daily reminders at 10 AM
    schedule.every().day.at("10:00").do(run_automations)
    
    print("Automation scheduler started")
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == '__main__':
    # Run scheduler
    schedule_automations()
