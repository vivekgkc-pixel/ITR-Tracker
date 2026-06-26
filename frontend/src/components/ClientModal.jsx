import { useState, useEffect } from 'react';
import { X, FileText, Plus, Download, Trash, ClipboardCheck, History, MessageSquare, AlertCircle } from 'lucide-react';
import { clientAPI } from '../api';
import './ClientModal.css';

function ClientModal({ client, assessmentYears, staff, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    pan: '',
    assessment_year_id: '',
    itr_type: '',
    date_received: '',
    staff_id: '',
    priority: 'Medium',
    preparation_done: false,
    reviewed: false,
    filed: false,
    filing_date: '',
    acknowledgement_number: '',
    contact_number: '',
    remarks: '',
  });

  // Tabs management for existing clients
  const [activeTab, setActiveTab] = useState('details');
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [panError, setPanError] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        pan: client.pan || '',
        assessment_year_id: client.assessment_year_id || '',
        itr_type: client.itr_type || '',
        date_received: client.date_received || '',
        staff_id: client.staff_id || '',
        priority: client.priority || 'Medium',
        preparation_done: client.preparation_done || false,
        reviewed: client.reviewed || false,
        filed: client.filed || false,
        filing_date: client.filing_date || '',
        acknowledgement_number: client.acknowledgement_number || '',
        contact_number: client.contact_number || '',
        remarks: client.remarks || '',
      });
      loadClientDetails();
    }
  }, [client]);

  const loadClientDetails = async () => {
    if (!client) return;
    setLoadingDetails(true);
    try {
      const response = await clientAPI.getClient(client.id);
      setClientDetails(response.data);
    } catch (error) {
      console.error('Failed to load full client details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePanChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, pan: value });
    
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (value.length === 10 && !panPattern.test(value)) {
      setPanError('Invalid Indian PAN format (e.g. ABCDE1234F)');
    } else {
      setPanError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (panError) {
      alert('Please correct the PAN syntax error before saving.');
      return;
    }
    onSave(formData);
  };

  // Document actions
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;
    try {
      await clientAPI.uploadDocument(client.id, selectedFile);
      setSelectedFile(null);
      alert('Document uploaded successfully!');
      loadClientDetails();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert(error.response?.data?.error || 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await clientAPI.deleteDocument(client.id);
      alert('Document deleted successfully.');
      loadClientDetails();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleDownloadDocument = async () => {
    try {
      const response = await clientAPI.downloadDocument(client.id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = clientDetails?.document_name || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Could not download document. It might not exist or backend is offline.');
    }
  };

  // Notes actions
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await clientAPI.addNote(client.id, { content: newNote });
      setNewNote('');
      loadClientDetails();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal client-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{client ? `Manage ${formData.name}` : 'Add Client'}</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        {client && (
          <div className="modal-tabs">
            <button
              className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <ClipboardCheck size={16} />
              Details
            </button>
            <button
              className={`modal-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              className={`modal-tab ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <MessageSquare size={16} />
              Notes
            </button>
            <button
              className={`modal-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              Activity Log
            </button>
          </div>
        )}

        <div className="modal-body scrollable-tab-content">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <div className="label-container">
                    <label>PAN Number *</label>
                    <a 
                      href="https://eportal.incometax.gov.in/iec/foservices/#/pre-login/verifyYourPAN" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="portal-link"
                    >
                      Verify on Portal ↗
                    </a>
                  </div>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={handlePanChange}
                    required
                    maxLength="10"
                    placeholder="ABCDE1234F"
                    className={panError ? 'input-error' : ''}
                  />
                  {panError && <span className="error-text">{panError}</span>}
                </div>
                <div className="form-group">
                  <label>Assessment Year</label>
                  <select
                    value={formData.assessment_year_id}
                    onChange={(e) => setFormData({ ...formData, assessment_year_id: e.target.value })}
                  >
                    <option value="">Select AY</option>
                    {assessmentYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.year}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>ITR Type</label>
                  <select
                    value={formData.itr_type}
                    onChange={(e) => setFormData({ ...formData, itr_type: e.target.value })}
                  >
                    <option value="">Select ITR Type</option>
                    <option value="ITR-1">ITR-1</option>
                    <option value="ITR-2">ITR-2</option>
                    <option value="ITR-3">ITR-3</option>
                    <option value="ITR-4">ITR-4</option>
                    <option value="ITR-5">ITR-5</option>
                    <option value="ITR-6">ITR-6</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Received</label>
                  <input
                    type="date"
                    value={formData.date_received}
                    onChange={(e) => setFormData({ ...formData, date_received: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Staff</label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Number (or Email)</label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    placeholder="9999999999 or client@email.com"
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="checkboxes-section">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="preparation_done"
                    checked={formData.preparation_done}
                    onChange={(e) => setFormData({ ...formData, preparation_done: e.target.checked })}
                  />
                  <label htmlFor="preparation_done">Preparation Done</label>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="reviewed"
                    checked={formData.reviewed}
                    onChange={(e) => setFormData({ ...formData, reviewed: e.target.checked })}
                  />
                  <label htmlFor="reviewed">Reviewed by Sir</label>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="filed"
                    checked={formData.filed}
                    onChange={(e) => setFormData({ ...formData, filed: e.target.checked })}
                  />
                  <label htmlFor="filed">ITR Filed</label>
                </div>
              </div>

              {formData.filed && (
                <div className="form-grid filed-info-section">
                  <div className="form-group">
                    <label>Filing Date</label>
                    <input
                      type="date"
                      value={formData.filing_date}
                      onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Acknowledgement Number</label>
                    <input
                      type="text"
                      value={formData.acknowledgement_number}
                      onChange={(e) => setFormData({ ...formData, acknowledgement_number: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </form>
          )}

          {activeTab === 'documents' && (
            <div className="documents-tab">
              {clientDetails?.document_name ? (
                <div className="uploaded-document-card">
                  <div className="doc-icon-container">
                    <FileText size={36} className="doc-icon" />
                  </div>
                  <div className="doc-info">
                    <p className="doc-name">{clientDetails.document_name}</p>
                    <span className="doc-meta">Stored securely on server</span>
                  </div>
                  <div className="doc-actions">
                    <button onClick={handleDownloadDocument} className="btn btn-secondary">
                      <Download size={16} />
                      Download
                    </button>
                    <button onClick={handleDeleteDocument} className="btn btn-danger">
                      <Trash size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder-card">
                  <FileText size={48} className="upload-icon" />
                  <h4>No files uploaded yet</h4>
                  <p>Upload files like Form 16, Acknowledgement PDF, or calculation sheets.</p>
                  
                  <div className="file-selector-input">
                    <input type="file" id="clientFile" onChange={handleFileChange} />
                    <label htmlFor="clientFile" className="btn btn-secondary">
                      {selectedFile ? selectedFile.name : 'Select File'}
                    </label>
                    {selectedFile && (
                      <button onClick={handleUploadDocument} className="btn btn-primary">
                        Upload file
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="notes-tab">
              <form onSubmit={handleAddNote} className="add-note-form">
                <textarea
                  placeholder="Type an internal collaboration note for the team..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows="3"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  Add Note
                </button>
              </form>

              <div className="notes-list">
                {clientDetails?.notes && clientDetails.notes.length > 0 ? (
                  clientDetails.notes.map(note => (
                    <div key={note.id} className="note-card">
                      <p className="note-content">{note.content}</p>
                      <div className="note-footer">
                        <span>Staff #{note.created_by}</span>
                        <span>{new Date(note.created_at).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No internal notes for this client yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab">
              {clientDetails?.activity_logs && clientDetails.activity_logs.length > 0 ? (
                <div className="timeline">
                  {clientDetails.activity_logs.map(log => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-badge">
                        <History size={14} />
                      </div>
                      <div className="timeline-panel">
                        <div className="timeline-header">
                          <span className="log-action">{log.action.toUpperCase()}</span>
                          <span className="log-date">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="log-desc">{log.description}</p>
                        <span className="log-author">By: Staff #{log.performed_by || 'system'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No activity logs recorded yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          {activeTab === 'details' && (
            <button type="submit" onClick={handleSubmit} className="btn btn-primary">
              Save Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientModal;
