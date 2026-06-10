'use client';

import React, { useState } from 'react';
import { LayoutDashboard, TrainTrack, Smartphone, Train } from 'lucide-react';
import {
  CrewPulseDashboard,
  FoisEtaTracker,
  LayoverConciergePWA,
} from '@/components/feature2';

type TabType = 'crew' | 'fois' | 'concierge';

export default function ZenwayDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('crew');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Top Header & Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16 border-b border-slate-100">
            <div className="flex items-center">
              <Train className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-xl font-bold text-slate-800 tracking-tight">Zenway.</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
              AD
            </div>
          </div>
          
          {/* Tabs */}
          <nav className="flex space-x-8 mt-2 overflow-x-auto no-scrollbar relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`flex items-center pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'crew'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Crew Pulse Monitor
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fois')}
              className={`flex items-center pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'fois'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <TrainTrack className="w-4 h-4 mr-2" />
              FOIS Freight Tracker
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('concierge')}
              className={`flex items-center pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'concierge'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Layover Concierge
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'crew' && (
            <div className="animate-in fade-in duration-300">
              <CrewPulseDashboard />
            </div>
          )}
          
          {activeTab === 'fois' && (
            <div className="animate-in fade-in duration-300">
              <FoisEtaTracker />
            </div>
          )}
          
          {activeTab === 'concierge' && (
            <div className="animate-in fade-in duration-300 flex justify-center">
              <div className="w-full max-w-md mt-4">
                <LayoverConciergePWA />
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
