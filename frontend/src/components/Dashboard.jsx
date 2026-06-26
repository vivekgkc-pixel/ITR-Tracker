import { useEffect, useState } from 'react';
import { dashboardAPI } from '../api';
import { Users, CheckCircle, Clock, AlertCircle, FileText, Calendar } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    filed: 0,
    under_review: 0,
    in_progress: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeadlines = () => {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rawDeadlines = [
      { id: 1, name: 'Individual & HUF ITR (Non-Audit)', dateStr: `July 31, ${currentYear}`, originalStr: 'July 31' },
      { id: 2, name: 'Tax Audit Reports Filing', dateStr: `September 30, ${currentYear}`, originalStr: 'September 30' },
      { id: 3, name: 'Corporate & Audit ITR filing', dateStr: `October 31, ${currentYear}`, originalStr: 'October 31' },
    ];

    return rawDeadlines.map(d => {
      let targetDate = new Date(d.dateStr);
      if (targetDate < today) {
        targetDate = new Date(d.originalStr + ', ' + (currentYear + 1));
      }
      const diffTime = targetDate - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status = 'safe';
      if (daysLeft <= 15) status = 'critical';
      else if (daysLeft <= 45) status = 'warning';

      return {
        ...d,
        targetFormatted: targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysLeft,
        status,
        percentage: Math.max(0, Math.min(100, (daysLeft / 120) * 100)) // Visual indicator
      };
    });
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const deadlines = getDeadlines();

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard">
        <div className="stat-card total">
          <Users className="stat-icon" />
          <h3>Total Clients</h3>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card filed">
          <CheckCircle className="stat-icon" />
          <h3>Filed</h3>
          <div className="value">{stats.filed}</div>
        </div>
        <div className="stat-card in-progress">
          <Clock className="stat-icon" />
          <h3>In Progress</h3>
          <div className="value">{stats.in_progress}</div>
        </div>
        <div className="stat-card under-review">
          <FileText className="stat-icon" />
          <h3>Under Review</h3>
          <div className="value">{stats.under_review}</div>
        </div>
        <div className="stat-card pending">
          <AlertCircle className="stat-icon" />
          <h3>Pending</h3>
          <div className="value">{stats.pending}</div>
        </div>
      </div>

      <div className="deadlines-section">
        <div className="section-header">
          <Calendar className="section-icon" />
          <h2>Filing Deadlines Tracker</h2>
        </div>
        <div className="deadlines-grid">
          {deadlines.map(deadline => (
            <div key={deadline.id} className={`deadline-card deadline-${deadline.status}`}>
              <div className="deadline-info">
                <h4>{deadline.name}</h4>
                <p className="due-date">Due: {deadline.targetFormatted}</p>
              </div>
              <div className="deadline-countdown">
                <span className="days-number">{deadline.daysLeft}</span>
                <span className="days-label">Days Left</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar bar-${deadline.status}`}
                  style={{ width: `${deadline.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
