import { useEffect, useState } from 'react';
import { clientAPI, assessmentYearAPI, staffAPI, dataAPI } from '../api';
import { Plus, Download, Printer, Search, Filter, MessageCircle, Mail, Bell, Trash } from 'lucide-react';
import ClientModal from './ClientModal';
import MessageModal from './MessageModal';
import './Clients.css';

function Clients() {
  const [clients, setClients] = useState([]);
  const [assessmentYears, setAssessmentYears] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAY, setFilterAY] = useState('');

  // New States
  const [selectedIds, setSelectedIds] = useState([]);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgClient, setMsgClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsRes, ayRes, staffRes] = await Promise.all([
        clientAPI.getClients(),
        assessmentYearAPI.getAssessmentYears(),
        staffAPI.getStaff(),
      ]);
      setClients(clientsRes.data.clients);
      setAssessmentYears(ayRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await clientAPI.deleteClient(id);
      setClients(clients.filter(c => c.id !== id));
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        await clientAPI.updateClient(editingClient.id, clientData);
        setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c));
      } else {
        const response = await clientAPI.createClient(clientData);
        setClients([...clients, response.data]);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await dataAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate standard filename matching backend pattern
      const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const filename = `clients_export_${dateStr}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleOpenMsgModal = (client) => {
    setMsgClient(client);
    setShowMsgModal(true);
  };

  const getStatus = (client) => {
    if (client.filed) return 'filed';
    if (client.reviewed) return 'under_review';
    if (client.preparation_done) return 'in_progress';
    return 'pending';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.pan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = !filterStaff || client.staff === filterStaff;
    const matchesStatus = !filterStatus || getStatus(client) === filterStatus;
    const matchesAY = !filterAY || client.assessment_year === filterAY;
    return matchesSearch && matchesStaff && matchesStatus && matchesAY;
  });

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredClients.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    }
  };

  const handleBulkStatus = async (status) => {
    if (!confirm(`Update status of ${selectedIds.length} selected clients to "${status.replace('_', ' ')}"?`)) return;
    try {
      await clientAPI.bulkUpdate({ ids: selectedIds, action: 'set_status', value: status });
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('Failed bulk status update:', error);
    }
  };

  const handleBulkStaff = async (staffVal) => {
    const staffId = staffVal === 'none' ? null : parseInt(staffVal);
    if (!confirm(`Assign ${selectedIds.length} selected clients to this staff member?`)) return;
    try {
      await clientAPI.bulkUpdate({ ids: selectedIds, action: 'assign_staff', value: staffId });
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('Failed bulk staff assignment:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected clients? This action is permanent.`)) return;
    try {
      await clientAPI.bulkUpdate({ ids: selectedIds, action: 'delete' });
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('Failed bulk delete:', error);
    }
  };

  if (loading) return <div className="loading">Loading clients...</div>;

  return (
    <div className="clients-page">
      <div className="page-header">
        <h2>Clients</h2>
        <div className="page-actions">
          <button onClick={handleAddClient} className="btn btn-primary">
            <Plus size={18} />
            Add Client
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={18} />
            Export CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary">
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} className="filter-icon" />
          <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}>
            <option value="">All Staff</option>
            {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="filed">Filed</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filterAY} onChange={(e) => setFilterAY(e.target.value)}>
            <option value="">All AY</option>
            {assessmentYears.map(ay => <option key={ay.id} value={ay.year}>{ay.year}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  checked={filteredClients.length > 0 && selectedIds.length === filteredClients.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>PAN</th>
              <th>AY</th>
              <th>Staff</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id} className={selectedIds.includes(client.id) ? 'row-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(client.id)}
                    onChange={(e) => handleSelectRow(e, client.id)}
                  />
                </td>
                <td className="client-name-cell" onClick={() => handleEditClient(client)}>
                  {client.name}
                </td>
                <td>{client.pan}</td>
                <td>{client.assessment_year}</td>
                <td>{client.staff || <span className="unassigned-text">Unassigned</span>}</td>
                <td className={`priority-${client.priority.toLowerCase()}`}>{client.priority}</td>
                <td>
                  <span className={`badge badge-${getStatus(client)}`}>
                    {getStatus(client).replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEditClient(client)} className="btn-icon" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => handleOpenMsgModal(client)} className="btn-icon" title="Send Message (WhatsApp/Email)">
                      <MessageCircle size={16} />
                    </button>
                    <button onClick={() => handleDeleteClient(client.id)} className="btn-icon btn-danger" title="Delete">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data-cell">No clients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span className="selected-badge">{selectedIds.length}</span>
            <span>Clients Selected</span>
          </div>
          
          <div className="bulk-controls">
            <div className="control-group">
              <label>Set Status:</label>
              <select onChange={(e) => { handleBulkStatus(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="" disabled>Choose...</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="under_review">Under Review</option>
                <option value="filed">Filed</option>
              </select>
            </div>

            <div className="control-group">
              <label>Assign Staff:</label>
              <select onChange={(e) => { handleBulkStaff(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="" disabled>Choose...</option>
                <option value="none">Unassign</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <button onClick={handleBulkDelete} className="btn-bulk-delete">
              <Trash size={16} />
              Delete
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editingClient}
          assessmentYears={assessmentYears}
          staff={staff}
          onSave={handleSaveClient}
          onClose={() => setShowModal(false)}
        />
      )}

      {showMsgModal && (
        <MessageModal
          client={msgClient}
          onClose={() => {
            setShowMsgModal(false);
            setMsgClient(null);
          }}
        />
      )}
    </div>
  );
}

export default Clients;
