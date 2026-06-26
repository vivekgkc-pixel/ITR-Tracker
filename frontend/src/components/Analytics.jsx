import { useEffect, useState } from 'react';
import { analyticsAPI } from '../api';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import './Analytics.css';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

function Analytics() {
  const [statusData, setStatusData] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [statusRes, staffRes, trendRes, priorityRes] = await Promise.all([
        analyticsAPI.getStatusBreakdown(),
        analyticsAPI.getStaffWorkload(),
        analyticsAPI.getMonthlyTrend(),
        analyticsAPI.getPriorityDistribution(),
      ]);

      setStatusData({
        labels: ['Filed', 'Under Review', 'In Progress', 'Pending'],
        datasets: [{
          data: [
            statusRes.data.filed,
            statusRes.data.under_review,
            statusRes.data.in_progress,
            statusRes.data.pending,
          ],
          backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'],
        }],
      });

      setStaffData({
        labels: staffRes.data.map(s => s.name),
        datasets: [{
          label: 'Clients',
          data: staffRes.data.map(s => s.count),
          backgroundColor: '#6366f1',
        }],
      });

      setTrendData({
        labels: Object.keys(trendRes.data),
        datasets: [{
          label: 'Filings',
          data: Object.values(trendRes.data),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
        }],
      });

      setPriorityData({
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
          data: [
            priorityRes.data.high,
            priorityRes.data.medium,
            priorityRes.data.low,
          ],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        }],
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="analytics-page">
      <h2>Analytics</h2>
      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Status Breakdown</h3>
          <div className="chart-container">
            <Pie data={statusData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Staff Workload</h3>
          <div className="chart-container">
            <Bar data={staffData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Monthly Filing Trend</h3>
          <div className="chart-container">
            <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Priority Distribution</h3>
          <div className="chart-container">
            <Doughnut data={priorityData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
