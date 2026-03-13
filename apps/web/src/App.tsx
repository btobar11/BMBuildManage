import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { BudgetEditor } from './features/budget/BudgetEditor';

function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold mb-4 text-gradient">Dashboard Proyectos</h1>
      <p className="text-gray-400 mb-8 max-w-md">Bienvenido a BMBuildManage. Selecciona un proyecto para comenzar a presupuestar.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <div 
          onClick={() => window.location.href='/budget/123'} 
          className="glass p-8 rounded-3xl cursor-pointer hover:bg-white/10 transition-all border-l-4 border-l-blue-600 group"
        >
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400">Remodelación Baño Pérez</h3>
          <p className="text-sm text-gray-500">Estado: Edición • Cliente: Juan Pérez</p>
        </div>
        <div className="glass p-8 rounded-3xl opacity-50 border-l-4 border-l-gray-600">
          <h3 className="text-xl font-bold mb-2 text-gray-400">Construcción Quincho Silva</h3>
          <p className="text-sm text-gray-800">Próximamente</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="/budget/:id" element={<BudgetEditor />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
