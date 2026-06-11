import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Global AI Analytics',
  description: 'Admin view for local AI tracking across devices.',
};

import { LayoutDashboard, ListTree, MessageSquare, Settings, Activity } from 'lucide-react';
import Link from 'next/link';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen bg-[#0F1115] text-slate-200 flex flex-col md:flex-row`}>
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#1A1D23] border-r border-[#2A2E35] shrink-0 flex flex-col">
          <div className="p-4 border-b border-[#2A2E35]">
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-cyan-400" />
              Langfuse Clone
            </h1>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-[#2A2E35] transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/traces" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-[#2A2E35] transition-colors">
              <ListTree className="w-4 h-4" />
              Traces
            </Link>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-500 cursor-not-allowed">
              <MessageSquare className="w-4 h-4" />
              Prompts
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-500 cursor-not-allowed">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0F1115] min-w-0">
          {children}
        </main>
      </body>
    </html>
  );
}
