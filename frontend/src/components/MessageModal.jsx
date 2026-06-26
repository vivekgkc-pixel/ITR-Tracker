import { useState, useEffect } from 'react';
import { X, MessageCircle, Mail } from 'lucide-react';
import './MessageModal.css';

function MessageModal({ client, onClose }) {
  const [templateType, setTemplateType] = useState('filing_confirmation');
  const [messageText, setMessageText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  const templates = {
    filing_confirmation: {
      subject: `ITR Filing Confirmation - ${client.name}`,
      body: `Dear ${client.name},

We are pleased to inform you that your Income Tax Return (ITR) for Assessment Year ${client.assessment_year || 'N/A'} has been successfully filed.

Filing Details:
- PAN: ${client.pan}
- ITR Type: ${client.itr_type || 'N/A'}
- Acknowledgement Number: ${client.acknowledgement_number || 'N/A'}

Thank you for choosing us for your tax services.

Best regards,
ITR Tracker Team`
    },
    document_reminder: {
      subject: `Reminder: Pending ITR Documents - ${client.name}`,
      body: `Dear ${client.name},

This is a friendly reminder that we are awaiting your documents to proceed with your ITR filing for Assessment Year ${client.assessment_year || 'N/A'}.

Please share the following at your earliest convenience:
- Form 16 / Salary Certificate
- Bank Statements for FY
- Investment Proofs (80C, 80D, etc.)
- Other Income documents

Let us know if you have any questions.

Best regards,
ITR Tracker Team`
    }
  };

  useEffect(() => {
    setMessageText(templates[templateType].body);
    setEmailSubject(templates[templateType].subject);
  }, [templateType, client]);

  const handleSendWhatsApp = () => {
    // Format contact number: strip symbols, make sure it has 91 prefix
    let number = client.contact_number || '';
    // Strip non-digits
    number = number.replace(/\D/g, '');
    if (number.length === 10) {
      number = '91' + number;
    }
    const url = `https://wa.me/${number}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleSendEmail = () => {
    // If contact number contains @ or is used as email, or default to empty
    let recipient = '';
    if (client.contact_number && client.contact_number.includes('@')) {
      recipient = client.contact_number;
    }
    const url = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageText)}`;
    window.location.href = url;
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="message-modal modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Message to {client.name}</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Select Message Template</label>
            <select 
              value={templateType} 
              onChange={(e) => setTemplateType(e.target.value)}
              className="template-select"
            >
              <option value="filing_confirmation">ITR Filed Confirmation</option>
              <option value="document_reminder">Pending Documents Reminder</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email Subject (Only for Email)</label>
            <input 
              type="text" 
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="email-subject-input"
            />
          </div>

          <div className="form-group">
            <label>Message Content</label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows="12"
              className="message-textarea"
            />
          </div>
        </div>
        <div className="modal-footer message-modal-footer">
          <button onClick={handleSendWhatsApp} className="btn btn-whatsapp" disabled={!client.contact_number}>
            <MessageCircle size={18} />
            Send via WhatsApp
          </button>
          <button onClick={handleSendEmail} className="btn btn-email">
            <Mail size={18} />
            Send via Email
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageModal;
