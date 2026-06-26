import { useState, useEffect } from 'react';
import { authAPI } from './api';
import Login from './components/Login';
import PinScreen from './components/PinScreen';
import MainApp from './components/MainApp';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [pinVerified, setPinVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const pinStatus = localStorage.getItem('pinVerified');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setPinVerified(pinStatus === 'true');
    }
    setLoading(false);
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const handlePinVerify = async (pin) => {
    try {
      await authAPI.verifyPin({ pin });
      localStorage.setItem('pinVerified', 'true');
      setPinVerified(true);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid PIN' 
      };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pinVerified');
    setUser(null);
    setPinVerified(false);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!pinVerified) {
    return <PinScreen onVerify={handlePinVerify} onLogout={handleLogout} />;
  }

  return <MainApp user={user} onLogout={handleLogout} />;
}

export default App;
