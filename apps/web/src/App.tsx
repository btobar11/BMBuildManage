import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import BudgetEditor from './features/budget/BudgetEditor';
import { FieldViewPage } from './features/field/FieldViewPage';
import { LandingPage } from './features/landing/LandingPage';
import { ApuLibraryPage } from './features/apu/ApuLibraryPage';
import { ResourcesPage } from './features/resources/ResourcesPage';
import { WorkersPage } from './features/workers/WorkersPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { CompanySettingsPage } from './features/company/CompanySettingsPage';
import { MainLayout } from './components/layout/MainLayout';
import { ConfigWarning } from './components/ConfigWarning';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { token, isLoading, isConfigured } = useAuth();
  const isAuthenticated = !!token;

  // Si Supabase no está configurado, mostrar warning
  if (!isConfigured && !isLoading) {
    return <ConfigWarning />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/onboarding" 
          element={isAuthenticated ? <OnboardingPage /> : <Navigate to="/login" />} 
        />
        
        {/* Protected routes with MainLayout */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/budget/:id" 
          element={isAuthenticated ? <MainLayout><BudgetEditor /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/budget/:id/field" 
          element={isAuthenticated ? <FieldViewPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/apu-library" 
          element={isAuthenticated ? <MainLayout><ApuLibraryPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/resources" 
          element={isAuthenticated ? <MainLayout><ResourcesPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/workers" 
          element={isAuthenticated ? <MainLayout><WorkersPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/invoices" 
          element={isAuthenticated ? <MainLayout><InvoicesPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/company-settings" 
          element={isAuthenticated ? <MainLayout><CompanySettingsPage /></MainLayout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/" 
          element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} 
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
