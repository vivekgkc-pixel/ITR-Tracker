import { useState } from 'react';
import { Lock } from 'lucide-react';
import './PinScreen.css';

function PinScreen({ onVerify, onLogout }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await onVerify(pin);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="pin-container">
      <div className="pin-card">
        <div className="pin-header">
          <Lock className="pin-icon" />
          <h2>Enter PIN</h2>
        </div>
        <form onSubmit={handleSubmit} className="pin-form">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            maxLength="4"
            className="pin-input"
            autoFocus
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary">
            Verify
          </button>
          <button type="button" onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export default PinScreen;
