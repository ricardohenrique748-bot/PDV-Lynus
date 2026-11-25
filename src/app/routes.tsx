import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { POSPage } from '@/modules/pos/pages/POSPage';
import { SalesPage } from '@/modules/sales/pages/SalesPage';
import { InventoryPage } from '@/modules/inventory/pages/InventoryPage';
import { PurchasesPage } from '@/modules/purchases/pages/PurchasesPage';
import { CustomersPage } from '@/modules/customers/pages/CustomersPage';
import { FinancialPage } from '@/modules/financial/pages/FinancialPage';
import { DREPage } from '@/modules/dre/pages/DREPage';
import { FiscalPage } from '@/modules/fiscal/pages/FiscalPage';
import { ReportsPage } from '@/modules/reports/pages/ReportsPage';
import { SettingsPage } from '@/modules/settings/pages/SettingsPage';
import { PlatformAdminPage } from '@/modules/platform-admin/pages/PlatformAdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-medium text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando LynusSystem ERP...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Protegidas no Layout Corporativo */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="financial" element={<FinancialPage />} />
        <Route path="dre" element={<DREPage />} />
        <Route path="fiscal" element={<FiscalPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="platform-admin" element={<PlatformAdminPage />} />
      </Route>

      {/* Rota Padrão / Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

