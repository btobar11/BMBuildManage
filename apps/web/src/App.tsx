import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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
import { RfisPage } from './features/rfis/RfisPage';
import { SubmittalsPage } from './features/submittals/SubmittalsPage';
import { PunchListPage } from './features/punch-list/PunchListPage';
import { SchedulePage } from './features/schedule/SchedulePage';
import { MainLayout } from './components/layout/MainLayout';
import { ConfigWarning } from './components/ConfigWarning';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VectorAI } from './components/AIAssistant';
import { lazy, Suspense } from 'react';
import BimAnalyticsPage from './features/bim-analytics/BimAnalyticsPage';
import AnalyticsDashboard from './features/bim-analytics/AnalyticsDashboard';

// Lazy load BIM pages (Three.js / ThatOpen are heavy ~2MB)
const BimLibraryPage = lazy(() => import('./features/bim/BimLibraryPage').then(m => ({ default: m.BimLibraryPage })));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando módulo 3D...</p>
      </div>
    </div>
  );
}

function App() {
  const { user, token, isLoading, isConfigured } = useAuth();
  console.log('[DEBUG App] isLoading:', isLoading, 'isConfigured:', isConfigured, 'hasToken:', !!token);
  const isAuthenticated = !!token;

  // Si Supabase no está configurado, mostrar warning
  if (!isConfigured && !isLoading) {
    console.log('[DEBUG App] Not configured, showing ConfigWarning');
    return <ConfigWarning />;
  }

  if (isLoading) {
    console.log('[DEBUG App] Loading - showing spinner');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('[DEBUG App] Rendering routes');
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
        
        {/* Onboarding Route - Only accessible if authenticated and NO company_id */}
        <Route 
          path="/onboarding" 
          element={
            isAuthenticated 
              ? (user?.company_id ? <Navigate to="/dashboard" replace /> : <OnboardingPage />)
              : <Navigate to="/login" />
          } 
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
          path="/budget/:id/schedule" 
          element={isAuthenticated ? <MainLayout><SchedulePage /></MainLayout> : <Navigate to="/login" />} 
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
          path="/rfis" 
          element={isAuthenticated ? <MainLayout><RfisPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/submittals" 
          element={isAuthenticated ? <MainLayout><SubmittalsPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/punch-list" 
          element={isAuthenticated ? <MainLayout><PunchListPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/bim" 
          element={isAuthenticated ? <MainLayout><Suspense fallback={<LoadingFallback />}><BimLibraryPage /></Suspense></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/bim-analytics" 
          element={isAuthenticated ? <MainLayout><BimAnalyticsPage /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/bi-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MainLayout><AnalyticsDashboard /></MainLayout>
            </ProtectedRoute>
          } 
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
      <VectorAI />
    </ErrorBoundary>
  );
}

export default App;
