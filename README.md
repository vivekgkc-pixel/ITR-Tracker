# ITR Tracker Web Application

Full-stack ITR Client Tracker with Flask backend and React frontend.

## Quick Start

### Windows
Double-click `start.bat` to launch the application

### Linux/Mac
Run `chmod +x start.sh` then `./start.sh`

## Manual Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## Default Credentials

- **Username**: admin
- **Password**: admin123
- **PIN**: 1234

## Features

- Client management (CRUD)
- Dashboard with statistics
- Analytics with charts
- Assessment year management
- Staff management
- CSV import/export
- Automated backups
- Email notifications
- WhatsApp reminders
- Activity logging
- Internal notes

## Project Structure

```
ITR TRACKER WEB PAGE/
├── backend/                 # Flask API Server
│   ├── app.py             # Main application
│   ├── models.py          # Database models
│   ├── routes.py          # API endpoints
│   ├── automation.py      # Automation scripts
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/              # React Frontend
│   ├── src/              # React components
│   ├── package.json      # Node dependencies
│   └── vite.config.js    # Vite configuration
├── start.bat             # Windows start script
├── start.sh              # Linux/Mac start script
└── README.md             # This file
```

## Configuration

### Backend (.env)
Edit `backend/.env` to configure:
- Database settings
- Email credentials
- Twilio credentials (for WhatsApp)
- Backup settings

### Frontend (.env)
Edit `frontend/.env` to set API URL:
```
VITE_API_URL=http://localhost:5000/api
```

## Stopping the Application

When using start scripts, press any key to stop all servers.

## Troubleshooting

**Backend won't start:**
- Check Python version (3.9+)
- Ensure virtual environment is activated
- Check port 5000 is not in use

**Frontend won't start:**
- Check Node.js version (18+)
- Run `npm install` if node_modules missing
- Check port 5173 is not in use

**Can't login:**
- Ensure backend is running
- Check default credentials
- Verify database is initialized

## Support

For detailed deployment instructions, see the main DEPLOYMENT.md file in the parent directory.
