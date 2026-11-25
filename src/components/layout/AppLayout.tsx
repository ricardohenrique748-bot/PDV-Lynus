import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/Toast';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Barra Lateral (Sidebar) */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Conteúdo Principal com Topbar Fixa */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-4 md:pt-4 lg:pt-4">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

