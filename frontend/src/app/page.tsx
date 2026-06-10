import React from 'react';
import {
  CrewPulseDashboard,
  FoisEtaTracker,
  LayoverConciergePWA,
} from '@/components/feature2';

export default function Feature2Showcase() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Feature 2: Ops & Crew Intelligence
          </h1>
          <p className="mt-2 text-slate-500">
            Showcase dashboard rendering the standalone React components for Crew Management, FOIS ETA Tracking, and the Layover Concierge.
          </p>
        </div>

        {/* Components Showcase */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-700">1. Crew Pulse Monitor</h2>
          <CrewPulseDashboard />
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-700">2. FOIS Freight Tracker</h2>
          <FoisEtaTracker />
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-700">3. Layover Concierge (Mobile Simulator)</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <LayoverConciergePWA />
          </div>
        </section>

      </div>
    </main>
  );
}
