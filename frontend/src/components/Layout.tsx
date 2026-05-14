import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      <Sidebar />
      <div className="ml-72 flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
