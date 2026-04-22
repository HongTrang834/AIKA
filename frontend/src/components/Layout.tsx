import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-72 flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-8 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
