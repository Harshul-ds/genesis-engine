import React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'var(--background)'
    }}>
      {/* ✨ NEW: Professional Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: '2rem',
        marginLeft: '60px' // Account for collapsed sidebar
      }}>
        {children}
      </main>
    </div>
  );
};
