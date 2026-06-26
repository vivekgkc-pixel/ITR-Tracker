from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Client, AssessmentYear, Staff, ActivityLog, Note, Settings, Backup
from datetime import datetime
import csv
import os
from werkzeug.utils import secure_filename
import uuid

api_bp = Blueprint('api', __name__)

# Configuration
UPLOAD_FOLDER = './uploads'
BACKUP_FOLDER = './backups'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(BACKUP_FOLDER):
    os.makedirs(BACKUP_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== AUTH ROUTES ====================

@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        pin=data.get('pin', '1234')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is inactive'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'pin': user.pin
        }
    }), 200

@api_bp.route('/auth/verify-pin', methods=['POST'])
def verify_pin():
    data = request.get_json()
    user = User.query.first()
    
    if not user:
        return jsonify({'error': 'No user found'}), 404
    
    if user.pin != data['pin']:
        return jsonify({'error': 'Invalid PIN'}), 401
    
    return jsonify({'message': 'PIN verified'}), 200

@api_bp.route('/auth/change-pin', methods=['POST'])
@jwt_required()
def change_pin():
    data = request.get_json()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    user.pin = data['new_pin']
    db.session.commit()
    
    return jsonify({'message': 'PIN changed successfully'}), 200

# ==================== CLIENT ROUTES ====================

@api_bp.route('/clients', methods=['GET'])
@jwt_required()
def get_clients():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('search', '')
    staff_filter = request.args.get('staff', '')
    status_filter = request.args.get('status', '')
    ay_filter = request.args.get('assessment_year', '')
    
    query = Client.query
    
    if search:
        query = query.filter(
            (Client.name.ilike(f'%{search}%')) | 
            (Client.pan.ilike(f'%{search}%'))
        )
    
    if staff_filter:
        query = query.filter(Client.staff_id == staff_filter)
    
    if ay_filter:
        query = query.filter(Client.assessment_year_id == ay_filter)
    
    if status_filter:
        if status_filter == 'filed':
            query = query.filter(Client.filed == True)
        elif status_filter == 'under_review':
            query = query.filter(Client.reviewed == True, Client.filed == False)
        elif status_filter == 'in_progress':
            query = query.filter(Client.preparation_done == True, Client.reviewed == False)
        elif status_filter == 'pending':
            query = query.filter(Client.preparation_done == False)
    
    clients = query.order_by(Client.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'clients': [{
            'id': c.id,
            'name': c.name,
            'pan': c.pan,
            'assessment_year': c.assessment_year.year if c.assessment_year else None,
            'itr_type': c.itr_type,
            'date_received': c.date_received.isoformat() if c.date_received else None,
            'staff': c.staff.name if c.staff else None,
            'priority': c.priority,
            'preparation_done': c.preparation_done,
            'reviewed': c.reviewed,
            'filed': c.filed,
            'filing_date': c.filing_date.isoformat() if c.filing_date else None,
            'acknowledgement_number': c.acknowledgement_number,
            'contact_number': c.contact_number,
            'remarks': c.remarks,
            'document_name': c.document_name,
            'created_at': c.created_at.isoformat()
        } for c in clients.items],
        'total': clients.total,
        'pages': clients.pages,
        'current_page': clients.page
    }), 200

@api_bp.route('/clients/<int:id>', methods=['GET'])
@jwt_required()
def get_client(id):
    client = Client.query.get_or_404(id)
    
    return jsonify({
        'id': client.id,
        'name': client.name,
        'pan': client.pan,
        'assessment_year_id': client.assessment_year_id,
        'assessment_year': client.assessment_year.year if client.assessment_year else None,
        'itr_type': client.itr_type,
        'date_received': client.date_received.isoformat() if client.date_received else None,
        'staff_id': client.staff_id,
        'staff': client.staff.name if client.staff else None,
        'priority': client.priority,
        'preparation_done': client.preparation_done,
        'reviewed': client.reviewed,
        'filed': client.filed,
        'filing_date': client.filing_date.isoformat() if client.filing_date else None,
        'acknowledgement_number': client.acknowledgement_number,
        'contact_number': client.contact_number,
        'remarks': client.remarks,
        'document_name': client.document_name,
        'document_path': client.document_path,
        'activity_logs': [{
            'id': log.id,
            'action': log.action,
            'description': log.description,
            'performed_by': log.performed_by,
            'created_at': log.created_at.isoformat()
        } for log in client.activity_logs],
        'notes': [{
            'id': note.id,
            'content': note.content,
            'created_by': note.created_by,
            'created_at': note.created_at.isoformat()
        } for note in client.notes]
    }), 200

@api_bp.route('/clients', methods=['POST'])
@jwt_required()
def create_client():
    data = request.get_json()
    user_id = get_jwt_identity()
    
    client = Client(
        name=data['name'],
        pan=data['pan'],
        assessment_year_id=data.get('assessment_year_id'),
        itr_type=data.get('itr_type'),
        date_received=datetime.strptime(data['date_received'], '%Y-%m-%d').date() if data.get('date_received') else None,
        staff_id=data.get('staff_id'),
        priority=data.get('priority', 'Medium'),
        preparation_done=data.get('preparation_done', False),
        reviewed=data.get('reviewed', False),
        filed=data.get('filed', False),
        filing_date=datetime.strptime(data['filing_date'], '%Y-%m-%d').date() if data.get('filing_date') else None,
        acknowledgement_number=data.get('acknowledgement_number'),
        contact_number=data.get('contact_number'),
        remarks=data.get('remarks')
    )
    
    db.session.add(client)
    db.session.commit()
    
    # Add activity log
    activity = ActivityLog(
        client_id=client.id,
        action='created',
        description='Client created',
        performed_by=str(user_id)
    )
    db.session.add(activity)
    db.session.commit()
    
    return jsonify({'message': 'Client created successfully', 'id': client.id}), 201

@api_bp.route('/clients/<int:id>', methods=['PUT'])
@jwt_required()
def update_client(id):
    data = request.get_json()
    user_id = get_jwt_identity()
    client = Client.query.get_or_404(id)
    
    # Track changes for activity log
    changes = []
    
    for field in ['name', 'pan', 'assessment_year_id', 'itr_type', 'staff_id', 'priority', 
                  'preparation_done', 'reviewed', 'filed', 'acknowledgement_number', 
                  'contact_number', 'remarks']:
        if field in data and getattr(client, field) != data[field]:
            old_value = getattr(client, field)
            new_value = data[field]
            changes.append(f'{field}: {old_value} → {new_value}')
            setattr(client, field, data[field])
    
    if 'date_received' in data:
        client.date_received = datetime.strptime(data['date_received'], '%Y-%m-%d').date() if data['date_received'] else None
    
    if 'filing_date' in data:
        client.filing_date = datetime.strptime(data['filing_date'], '%Y-%m-%d').date() if data['filing_date'] else None
    
    client.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Add activity log
    if changes:
        activity = ActivityLog(
            client_id=client.id,
            action='updated',
            description=', '.join(changes),
            performed_by=str(user_id)
        )
        db.session.add(activity)
        db.session.commit()
    
    return jsonify({'message': 'Client updated successfully'}), 200

@api_bp.route('/clients/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_client(id):
    client = Client.query.get_or_404(id)
    user_id = get_jwt_identity()
    
    # Delete document if exists
    if client.document_path and os.path.exists(client.document_path):
        os.remove(client.document_path)
    
    db.session.delete(client)
    db.session.commit()
    
    return jsonify({'message': 'Client deleted successfully'}), 200

@api_bp.route('/clients/bulk-update', methods=['POST'])
@jwt_required()
def bulk_update_clients():
    data = request.get_json()
    client_ids = data.get('ids', [])
    action = data.get('action') # 'assign_staff', 'set_status', 'delete'
    value = data.get('value')
    user_id = get_jwt_identity()

    if not client_ids:
        return jsonify({'error': 'No client IDs provided'}), 400

    clients = Client.query.filter(Client.id.in_(client_ids)).all()

    if action == 'assign_staff':
        for c in clients:
            c.staff_id = value if value else None
            db.session.add(ActivityLog(
                client_id=c.id, 
                action='updated', 
                description=f'Staff changed via bulk action', 
                performed_by=str(user_id)
            ))
    elif action == 'set_status':
        for c in clients:
            if value == 'pending':
                c.preparation_done = False
                c.reviewed = False
                c.filed = False
            elif value == 'in_progress':
                c.preparation_done = True
                c.reviewed = False
                c.filed = False
            elif value == 'under_review':
                c.preparation_done = True
                c.reviewed = True
                c.filed = False
            elif value == 'filed':
                c.preparation_done = True
                c.reviewed = True
                c.filed = True
                if not c.filing_date:
                    c.filing_date = datetime.utcnow().date()
            
            db.session.add(ActivityLog(
                client_id=c.id, 
                action='updated', 
                description=f'Status updated to {value} via bulk action', 
                performed_by=str(user_id)
            ))
    elif action == 'delete':
        for c in clients:
            if c.document_path and os.path.exists(c.document_path):
                os.remove(c.document_path)
            db.session.delete(c)
    else:
        return jsonify({'error': 'Invalid bulk action'}), 400

    db.session.commit()
    return jsonify({'message': f'Bulk action completed for {len(clients)} clients'}), 200

@api_bp.route('/clients/<int:id>/document', methods=['POST'])
@jwt_required()
def upload_document(id):
    client = Client.query.get_or_404(id)
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Delete old document if exists
    if client.document_path and os.path.exists(client.document_path):
        os.remove(client.document_path)
    
    # Save new file
    filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    client.document_path = filepath
    client.document_name = file.filename
    db.session.commit()
    
    return jsonify({'message': 'Document uploaded successfully'}), 200

@api_bp.route('/clients/<int:id>/document', methods=['DELETE'])
@jwt_required()
def delete_document(id):
    client = Client.query.get_or_404(id)
    
    if client.document_path and os.path.exists(client.document_path):
        os.remove(client.document_path)
    
    client.document_path = None
    client.document_name = None
    db.session.commit()
    
    return jsonify({'message': 'Document deleted successfully'}), 200

@api_bp.route('/clients/<int:id>/document', methods=['GET'])
@jwt_required()
def download_document(id):
    client = Client.query.get_or_404(id)
    if not client.document_path or not os.path.exists(client.document_path):
        return jsonify({'error': 'No document uploaded for this client'}), 404
    try:
        return send_file(
            client.document_path,
            as_attachment=True,
            download_name=client.document_name or 'document'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/clients/<int:id>/notes', methods=['POST'])
@jwt_required()
def add_note(id):
    data = request.get_json()
    user_id = get_jwt_identity()
    
    note = Note(
        client_id=id,
        content=data['content'],
        created_by=str(user_id)
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify({'message': 'Note added successfully'}), 201

# ==================== ASSESSMENT YEAR ROUTES ====================

@api_bp.route('/assessment-years', methods=['GET'])
@jwt_required()
def get_assessment_years():
    years = AssessmentYear.query.filter_by(is_active=True).all()
    
    return jsonify([{
        'id': y.id,
        'year': y.year
    } for y in years]), 200

@api_bp.route('/assessment-years', methods=['POST'])
@jwt_required()
def create_assessment_year():
    data = request.get_json()
    
    if AssessmentYear.query.filter_by(year=data['year']).first():
        return jsonify({'error': 'Assessment year already exists'}), 400
    
    year = AssessmentYear(year=data['year'])
    db.session.add(year)
    db.session.commit()
    
    return jsonify({'message': 'Assessment year created successfully'}), 201

@api_bp.route('/assessment-years/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_assessment_year(id):
    year = AssessmentYear.query.get_or_404(id)
    year.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Assessment year deleted successfully'}), 200

# ==================== STAFF ROUTES ====================

@api_bp.route('/staff', methods=['GET'])
@jwt_required()
def get_staff():
    staff = Staff.query.filter_by(is_active=True).all()
    
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'email': s.email,
        'phone': s.phone
    } for s in staff]), 200

@api_bp.route('/staff', methods=['POST'])
@jwt_required()
def create_staff():
    data = request.get_json()
    
    staff = Staff(
        name=data['name'],
        email=data.get('email'),
        phone=data.get('phone')
    )
    db.session.add(staff)
    db.session.commit()
    
    return jsonify({'message': 'Staff created successfully'}), 201

@api_bp.route('/staff/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_staff(id):
    staff = Staff.query.get_or_404(id)
    staff.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Staff deleted successfully'}), 200

# ==================== DASHBOARD ROUTES ====================

@api_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    total = Client.query.count()
    filed = Client.query.filter_by(filed=True).count()
    under_review = Client.query.filter_by(reviewed=True, filed=False).count()
    in_progress = Client.query.filter_by(preparation_done=True, reviewed=False).count()
    pending = Client.query.filter_by(preparation_done=False).count()
    
    return jsonify({
        'total': total,
        'filed': filed,
        'under_review': under_review,
        'in_progress': in_progress,
        'pending': pending
    }), 200

# ==================== ANALYTICS ROUTES ====================

@api_bp.route('/analytics/status-breakdown', methods=['GET'])
@jwt_required()
def get_status_breakdown():
    filed = Client.query.filter_by(filed=True).count()
    under_review = Client.query.filter_by(reviewed=True, filed=False).count()
    in_progress = Client.query.filter_by(preparation_done=True, reviewed=False).count()
    pending = Client.query.filter_by(preparation_done=False).count()
    
    return jsonify({
        'filed': filed,
        'under_review': under_review,
        'in_progress': in_progress,
        'pending': pending
    }), 200

@api_bp.route('/analytics/staff-workload', methods=['GET'])
@jwt_required()
def get_staff_workload():
    staff_list = Staff.query.filter_by(is_active=True).all()
    
    workload = []
    for staff in staff_list:
        count = Client.query.filter_by(staff_id=staff.id).count()
        workload.append({
            'name': staff.name,
            'count': count
        })
    
    return jsonify(workload), 200

@api_bp.route('/analytics/monthly-trend', methods=['GET'])
@jwt_required()
def get_monthly_trend():
    clients = Client.query.filter(Client.filing_date.isnot(None)).all()
    
    monthly = {}
    for client in clients:
        month = client.filing_date.strftime('%Y-%m')
        monthly[month] = monthly.get(month, 0) + 1
    
    return jsonify(monthly), 200

@api_bp.route('/analytics/priority-distribution', methods=['GET'])
@jwt_required()
def get_priority_distribution():
    high = Client.query.filter_by(priority='High').count()
    medium = Client.query.filter_by(priority='Medium').count()
    low = Client.query.filter_by(priority='Low').count()
    
    return jsonify({
        'high': high,
        'medium': medium,
        'low': low
    }), 200

# ==================== CSV IMPORT/EXPORT ====================

@api_bp.route('/data/export-csv', methods=['GET'])
@jwt_required()
def export_csv():
    clients = Client.query.all()
    
    filename = f'clients_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    filepath = os.path.join(BACKUP_FOLDER, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Name', 'PAN', 'Assessment Year', 'ITR Type', 'Date Received', 
                     'Staff', 'Priority', 'Preparation Done', 'Reviewed', 'Filed',
                     'Filing Date', 'Acknowledgement Number', 'Contact Number', 'Remarks']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for client in clients:
            writer.writerow({
                'Name': client.name,
                'PAN': client.pan,
                'Assessment Year': client.assessment_year.year if client.assessment_year else '',
                'ITR Type': client.itr_type or '',
                'Date Received': client.date_received.isoformat() if client.date_received else '',
                'Staff': client.staff.name if client.staff else '',
                'Priority': client.priority,
                'Preparation Done': 'Yes' if client.preparation_done else 'No',
                'Reviewed': 'Yes' if client.reviewed else 'No',
                'Filed': 'Yes' if client.filed else 'No',
                'Filing Date': client.filing_date.isoformat() if client.filing_date else '',
                'Acknowledgement Number': client.acknowledgement_number or '',
                'Contact Number': client.contact_number or '',
                'Remarks': client.remarks or ''
            })
    
    # Stream the file directly so the browser downloads it
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype='text/csv'
    )

@api_bp.route('/data/import-csv', methods=['POST'])
@jwt_required()
def import_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # Read CSV file
        csv_file = file.read().decode('utf-8')
        csv_reader = csv.DictReader(csv_file.splitlines())
        
        imported = 0
        for row in csv_reader:
            # Check if client already exists
            existing = Client.query.filter_by(pan=row['PAN']).first()
            if existing:
                continue
            
            # Find or create assessment year
            ay = AssessmentYear.query.filter_by(year=str(row['Assessment Year'])).first()
            if not ay and row['Assessment Year']:
                ay = AssessmentYear(year=str(row['Assessment Year']))
                db.session.add(ay)
                db.session.flush()
            
            # Find or create staff
            staff = None
            if row['Staff']:
                staff = Staff.query.filter_by(name=row['Staff']).first()
                if not staff:
                    staff = Staff(name=row['Staff'])
                    db.session.add(staff)
                    db.session.flush()
            
            client = Client(
                name=row['Name'],
                pan=row['PAN'],
                assessment_year_id=ay.id if ay else None,
                itr_type=row['ITR Type'] if row['ITR Type'] else None,
                staff_id=staff.id if staff else None,
                priority=row['Priority'] if row['Priority'] else 'Medium',
                preparation_done=str(row['Preparation Done']).lower() == 'yes' if row['Preparation Done'] else False,
                reviewed=str(row['Reviewed']).lower() == 'yes' if row['Reviewed'] else False,
                filed=str(row['Filed']).lower() == 'yes' if row['Filed'] else False,
                contact_number=row['Contact Number'] if row['Contact Number'] else None,
                remarks=row['Remarks'] if row['Remarks'] else None
            )
            
            db.session.add(client)
            imported += 1
        
        db.session.commit()
        
        return jsonify({'message': f'Imported {imported} clients successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ==================== BACKUP ROUTES ====================

@api_bp.route('/data/backup', methods=['POST'])
@jwt_required()
def create_backup():
    import json
    from sqlalchemy import inspect
    
    # Export all data to JSON
    backup_data = {
        'clients': [],
        'assessment_years': [],
        'staff': [],
        'settings': [],
        'backup_date': datetime.now().isoformat()
    }
    
    # Clients
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
    
    # Assessment Years
    for ay in AssessmentYear.query.all():
        backup_data['assessment_years'].append({
            'id': ay.id,
            'year': ay.year,
            'is_active': ay.is_active
        })
    
    # Staff
    for staff in Staff.query.all():
        backup_data['staff'].append({
            'id': staff.id,
            'name': staff.name,
            'email': staff.email,
            'phone': staff.phone,
            'is_active': staff.is_active
        })
    
    filename = f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    filepath = os.path.join(BACKUP_FOLDER, filename)
    
    with open(filepath, 'w') as f:
        json.dump(backup_data, f, indent=2)
    
    # Record backup
    backup = Backup(
        filename=filename,
        file_path=filepath,
        file_size=os.path.getsize(filepath)
    )
    db.session.add(backup)
    db.session.commit()
    
    # Stream the backup file directly so the browser downloads it
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype='application/json'
    )

@api_bp.route('/data/restore', methods=['POST'])
@jwt_required()
def restore_backup():
    import json
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    try:
        backup_data = json.load(file)
        
        # Clear existing data
        ActivityLog.query.delete()
        Note.query.delete()
        Client.query.delete()
        Staff.query.delete()
        AssessmentYear.query.delete()
        db.session.commit()
        
        # Restore Assessment Years
        for ay_data in backup_data.get('assessment_years', []):
            ay = AssessmentYear(
                id=ay_data['id'],
                year=ay_data['year'],
                is_active=ay_data['is_active']
            )
            db.session.add(ay)
        
        # Restore Staff
        for staff_data in backup_data.get('staff', []):
            staff = Staff(
                id=staff_data['id'],
                name=staff_data['name'],
                email=staff_data.get('email'),
                phone=staff_data.get('phone'),
                is_active=staff_data['is_active']
            )
            db.session.add(staff)
        
        db.session.commit()
        
        # Restore Clients
        for client_data in backup_data.get('clients', []):
            client = Client(
                id=client_data['id'],
                name=client_data['name'],
                pan=client_data['pan'],
                assessment_year_id=client_data.get('assessment_year_id'),
                itr_type=client_data.get('itr_type'),
                date_received=datetime.fromisoformat(client_data['date_received']) if client_data.get('date_received') else None,
                staff_id=client_data.get('staff_id'),
                priority=client_data.get('priority', 'Medium'),
                preparation_done=client_data.get('preparation_done', False),
                reviewed=client_data.get('reviewed', False),
                filed=client_data.get('filed', False),
                filing_date=datetime.fromisoformat(client_data['filing_date']) if client_data.get('filing_date') else None,
                acknowledgement_number=client_data.get('acknowledgement_number'),
                contact_number=client_data.get('contact_number'),
                remarks=client_data.get('remarks'),
                document_name=client_data.get('document_name')
            )
            db.session.add(client)
        
        db.session.commit()
        
        return jsonify({'message': 'Backup restored successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/data/reset', methods=['POST'])
@jwt_required()
def reset_data():
    ActivityLog.query.delete()
    Note.query.delete()
    Client.query.delete()
    Staff.query.delete()
    AssessmentYear.query.delete()
    db.session.commit()
    
    return jsonify({'message': 'All data reset successfully'}), 200

@api_bp.route('/data/trigger-reminders', methods=['POST'])
@jwt_required()
def trigger_reminders():
    try:
        from automation import run_automations
        run_automations()
        return jsonify({'message': 'Automated reminders triggered successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
