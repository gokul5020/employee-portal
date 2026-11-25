import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './services/api';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';

const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(({ Profile }) => ({ default: Profile })));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement').then(({ LeaveManagement }) => ({ default: LeaveManagement })));
const Payroll = lazy(() => import('./pages/Payroll').then(({ Payroll }) => ({ default: Payroll })));
const Assistant = lazy(() => import('./pages/Assistant').then(({ Assistant }) => ({ default: Assistant })));
const AIInsightsPage = lazy(() => import('./pages/AIInsights').then(({ AIInsightsPage }) => ({ default: AIInsightsPage })));

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
        <Suspense fallback={
          <div role="status" aria-label="Loading page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
            <div className="spinner spinner-brand" style={{ width: 28, height: 28 }} />
          </div>
        }>
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
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/ai-insights" element={<AIInsightsPage user={user} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Router>
          )}
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
