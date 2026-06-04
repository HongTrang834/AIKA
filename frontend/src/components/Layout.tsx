import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-snow-white flex overflow-hidden">
      <Sidebar />
      <div className="ml-72 flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-[1140px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
