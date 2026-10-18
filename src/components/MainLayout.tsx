import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../contexts/ThemeContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  // Start with sidebar closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  const bgClass = theme === 'light' ? 'bg-[#fafaf9]' : 'bg-[#0f0f10]';

  return (
    <div className={`flex h-screen ${bgClass} ${theme === 'light' ? 'text-gray-900' : 'text-white'} overflow-hidden`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative min-w-0">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content — smooth scroll + fade transition between routes */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="p-4 md:p-6 lg:p-8 page-transition min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
