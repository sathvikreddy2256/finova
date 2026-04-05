import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Onboarding   from './pages/Onboarding';
import Layout       from './components/Layout';
import Dashboard    from './pages/Dashboard';
import Expenses     from './pages/Expenses';
import Investments  from './pages/Investments';
import TaxPlanner   from './pages/TaxPlanner';
import Insurance    from './pages/Insurance';
import Debt         from './pages/Debt';
import Retirement   from './pages/Retirement';
import AIInsights   from './pages/AIInsights';

function Spinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#07080f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"
          style={{ borderWidth: '3px' }} />
        <p className="text-slate-500 text-sm">Loading Finova…</p>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profileComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardingGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.profileComplete) return <Navigate to="/dashboard" replace />;
  return children;
}

function Public({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.profileComplete ? '/dashboard' : '/onboarding'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"      element={<Public><Login /></Public>} />
      <Route path="/register"   element={<Public><Register /></Public>} />
      <Route path="/onboarding" element={<OnboardingGate><Onboarding /></OnboardingGate>} />
      <Route path="/"           element={<Protected><Layout /></Protected>}>
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="expenses"    element={<Expenses />} />
        <Route path="investments" element={<Investments />} />
        <Route path="tax"         element={<TaxPlanner />} />
        <Route path="insurance"   element={<Insurance />} />
        <Route path="debt"        element={<Debt />} />
        <Route path="retirement"  element={<Retirement />} />
        <Route path="ai-insights" element={<AIInsights />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b', color: '#f1f5f9',
              border: '1px solid #334155', borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
            },
            success: { iconTheme: { primary: '#7c3aed', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
