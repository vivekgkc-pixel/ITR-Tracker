import { useEffect, useState } from 'react';
import { assessmentYearAPI, staffAPI, authAPI, dataAPI } from '../api';
import { Plus, X, Download, Upload, RotateCcw, Lock, Bell } from 'lucide-react';
import './Settings.css';

function Settings() {
  const [assessmentYears, setAssessmentYears] = useState([]);
  const [staff, setStaff] = useState([]);
  const [newAY, setNewAY] = useState('');
  const [newStaff, setNewStaff] = useState('');
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ayRes, staffRes] = await Promise.all([
        assessmentYearAPI.getAssessmentYears(),
        staffAPI.getStaff(),
      ]);
      setAssessmentYears(ayRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleAddAY = async () => {
    if (!newAY) return;
    try {
      await assessmentYearAPI.createAssessmentYear({ year: newAY });
      setNewAY('');
      loadData();
    } catch (error) {
      console.error('Failed to add AY:', error);
    }
  };

  const handleDeleteAY = async (id) => {
    try {
      await assessmentYearAPI.deleteAssessmentYear(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete AY:', error);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff) return;
    try {
      await staffAPI.createStaff({ name: newStaff });
      setNewStaff('');
      loadData();
    } catch (error) {
      console.error('Failed to add staff:', error);
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await staffAPI.deleteStaff(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const handleChangePin = async () => {
    if (!newPin || newPin.length !== 4) {
      alert('PIN must be 4 digits');
      return;
    }
    try {
      await authAPI.changePin({ new_pin: newPin });
      setNewPin('');
      alert('PIN changed successfully');
    } catch (error) {
      console.error('Failed to change PIN:', error);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await dataAPI.backup();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename matching backend pattern
      const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const filename = `backup_${dateStr}.json`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Failed to download backup');
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await dataAPI.restore(file);
      alert('Backup restored successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await dataAPI.importCSV(file);
      alert('CSV imported successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to import CSV:', error);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) return;
    try {
      await dataAPI.reset();
      alert('All data reset successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  };

  const handleTriggerReminders = async () => {
    try {
      await dataAPI.triggerReminders();
      alert('Automated WhatsApp and Email reminders triggered successfully.');
    } catch (error) {
      console.error('Failed to trigger reminders:', error);
      alert('Failed to trigger reminders. Make sure backend credentials are set up.');
    }
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3><Lock size={20} /> Security</h3>
        <div className="settings-item">
          <label>Change PIN</label>
          <div className="input-group">
            <input
              type="text"
              placeholder="New 4-digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength="4"
            />
            <button onClick={handleChangePin} className="btn btn-primary">
              Update
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Assessment Years</h3>
        <div className="settings-item">
          <label>Add New Assessment Year</label>
          <div className="input-group">
            <input
              type="text"
              placeholder="e.g., 2026-27"
              value={newAY}
              onChange={(e) => setNewAY(e.target.value)}
            />
            <button onClick={handleAddAY} className="btn btn-primary">
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
        <div className="tags-list">
          {assessmentYears.map(ay => (
            <div key={ay.id} className="tag">
              {ay.year}
              <button onClick={() => handleDeleteAY(ay.id)} className="tag-remove">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Staff Members</h3>
        <div className="settings-item">
          <label>Add New Staff Member</label>
          <div className="input-group">
            <input
              type="text"
              placeholder="Staff name"
              value={newStaff}
              onChange={(e) => setNewStaff(e.target.value)}
            />
            <button onClick={handleAddStaff} className="btn btn-primary">
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
        <div className="tags-list">
          {staff.map(s => (
            <div key={s.id} className="tag">
              {s.name}
              <button onClick={() => handleDeleteStaff(s.id)} className="tag-remove">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Management</h3>
        <div className="settings-grid">
          <div className="settings-item">
            <label>Bulk Import CSV</label>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="file-input" />
          </div>
          <div className="settings-item">
            <label>Backup Data</label>
            <button onClick={handleBackup} className="btn btn-success">
              <Download size={18} />
              Download Backup
            </button>
          </div>
          <div className="settings-item">
            <label>Restore Data</label>
            <input type="file" accept=".json" onChange={handleRestore} className="file-input" />
          </div>
          <div className="settings-item">
            <label>Reset All Data</label>
            <button onClick={handleReset} className="btn btn-danger">
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
          <div className="settings-item">
            <label>Manual Reminders Trigger</label>
            <button onClick={handleTriggerReminders} className="btn btn-primary">
              <Bell size={18} />
              Trigger Reminders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
