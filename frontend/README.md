# ITR Tracker Frontend

React frontend for ITR Client Tracker application.

## Features

- Modern React with hooks
- Vite for fast development
- Chart.js for analytics visualization
- Lucide React icons
- Responsive design
- JWT authentication
- PIN protection
- Real-time data updates
- Tabbed interface (Clients, Analytics, Settings)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Edit `.env` with your API URL:
```
VITE_API_URL=http://localhost:5000/api
```

## Development

Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build for Production

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── App.jsx              # Main application component
│   ├── MainApp.jsx          # Main app with tabs
│   ├── Login.jsx            # Login screen
│   ├── PinScreen.jsx        # PIN verification
│   ├── Dashboard.jsx        # Dashboard stats
│   ├── Clients.jsx          # Clients table and management
│   ├── ClientModal.jsx      # Add/Edit client modal
│   ├── Analytics.jsx        # Analytics charts
│   └── Settings.jsx         # Settings page
├── api.js                   # API client with axios
├── App.css                  # Global styles
├── index.css                # Base styles
└── main.jsx                 # Entry point
```

## Components

### Authentication
- **Login**: Username/password authentication
- **PinScreen**: 4-digit PIN verification

### Main Application
- **Dashboard**: Statistics cards showing client counts
- **Clients**: Client table with search, filters, and CRUD operations
- **Analytics**: Charts for status breakdown, staff workload, trends
- **Settings**: Manage assessment years, staff, PIN, and data operations

## API Integration

All API calls are handled through `api.js` using axios:
- Authentication endpoints
- Client CRUD operations
- Assessment year and staff management
- Analytics data
- CSV import/export
- Backup/restore operations

## Styling

- CSS modules for component-specific styles
- Modern gradient backgrounds
- Responsive design with mobile support
- Smooth animations and transitions

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
