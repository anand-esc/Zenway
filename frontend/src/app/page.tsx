'use client';

import React, { useState } from 'react';
import { LayoutDashboard, TrainTrack, Smartphone, Train, Activity, Map, Sun, Moon, Bell } from 'lucide-react';
import {
  CrewPulseDashboard,
  FoisEtaTracker,
  LayoverConcierge,
} from '@/components/feature2';
import { useGlobal } from '@/context/GlobalContext';

export default function ZenwayDashboard() {
  const [activeTab, setActiveTab] = useState<'crew' | 'fois' | 'concierge'>('crew');
  const { theme, toggleTheme, alerts } = useGlobal();

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-50 flex items-center justify-between border-b px-6 py-3 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-inner">
            <Train className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Zenway<span className="text-indigo-600">.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`rounded-full p-2 transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <div className="relative">
            <button className={`rounded-full p-2 transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation (Tabs) */}
      <div className={`border-b px-6 transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('crew')}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors ${
              activeTab === 'crew'
                ? 'border-indigo-600 text-indigo-600'
                : theme === 'dark' 
                  ? 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200' 
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Activity className="h-4 w-4" />
            Crew Pulse Monitor
          </button>
          
          <button
            onClick={() => setActiveTab('fois')}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors ${
              activeTab === 'fois'
                ? 'border-indigo-600 text-indigo-600'
                : theme === 'dark' 
                  ? 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200' 
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Map className="h-4 w-4" />
            FOIS Freight Tracker
          </button>

          <button
            onClick={() => setActiveTab('concierge')}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors ${
              activeTab === 'concierge'
                ? 'border-indigo-600 text-indigo-600'
                : theme === 'dark' 
                  ? 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200' 
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Layover Concierge
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-6 sm:p-8">
        {activeTab === 'crew' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CrewPulseDashboard />
          </div>
        )}
        
        {activeTab === 'fois' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FoisEtaTracker />
          </div>
        )}

        {activeTab === 'concierge' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LayoverConcierge />
          </div>
        )}
      </main>
    </div>
  );
}
