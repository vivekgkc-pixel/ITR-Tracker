# ITR Tracker Backend

Flask backend API for ITR Client Tracker application.

## Features

- RESTful API with Flask
- SQLite database with SQLAlchemy ORM
- JWT authentication
- CSV import/export
- Automated backups
- Email notifications
- WhatsApp reminders via Twilio
- Data analytics endpoints

## Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

## Running the Application

Development mode:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/verify-pin` - Verify PIN
- `POST /api/auth/change-pin` - Change PIN

### Clients
- `GET /api/clients` - Get all clients (with pagination, filters)
- `GET /api/clients/<id>` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/<id>` - Update client
- `DELETE /api/clients/<id>` - Delete client
- `POST /api/clients/<id>/document` - Upload document
- `DELETE /api/clients/<id>/document` - Delete document
- `POST /api/clients/<id>/notes` - Add note

### Assessment Years
- `GET /api/assessment-years` - Get all assessment years
- `POST /api/assessment-years` - Create assessment year
- `DELETE /api/assessment-years/<id>` - Delete assessment year

### Staff
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff
- `DELETE /api/staff/<id>` - Delete staff

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Analytics
- `GET /api/analytics/status-breakdown` - Get status breakdown
- `GET /api/analytics/staff-workload` - Get staff workload
- `GET /api/analytics/monthly-trend` - Get monthly filing trend
- `GET /api/analytics/priority-distribution` - Get priority distribution

### Data Management
- `GET /api/data/export-csv` - Export clients to CSV
- `POST /api/data/import-csv` - Import clients from CSV
- `POST /api/data/backup` - Create JSON backup
- `POST /api/data/restore` - Restore from backup
- `POST /api/data/reset` - Reset all data

## Automation

Run the automation scheduler:
```bash
python automation.py
```

This will:
- Create daily backups at 2 AM
- Send reminders to pending clients at 10 AM

## Environment Variables

See `.env.example` for all required environment variables.

## Database

The application uses SQLite by default. The database file is `itr_tracker.db`.

To initialize the database:
```python
from app import app, db
with app.app_context():
    db.create_all()
```

## Production Deployment

For production deployment:
1. Use a production database (PostgreSQL recommended)
2. Set `FLASK_ENV=production`
3. Use a proper WSGI server (Gunicorn)
4. Configure proper CORS origins
5. Use environment-specific secrets
6. Set up proper logging
