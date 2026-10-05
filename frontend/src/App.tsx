import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './services/api';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { LeaveManagement } from './pages/LeaveManagement';
import { Payroll } from './pages/Payroll';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const handleProfileUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
        }}
      >
        <div className="spinner spinner-brand" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        {!token || !user ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Router>
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/profile" element={<Profile user={user} onProfileUpdate={handleProfileUpdate} />} />
                <Route path="/leaves" element={<LeaveManagement user={user} />} />
                <Route path="/payroll" element={<Payroll user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
