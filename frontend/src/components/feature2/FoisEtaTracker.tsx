'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Train,
  MapPin,
  Cloud,
  TrafficCone,
  Radio,
  Clock,
  Warehouse,
  Loader2,
  Info
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchAllRakes, fetchBatchEtas, fetchCongestion } from '../../services/api';

const InteractiveFoisMap = dynamic(() => import('./InteractiveFoisMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading live map...</div>
});

export interface ConfidenceBand {
  early: number;
  on_time: number;
  delayed: number;
}

export interface RakeETA {
  rake_id: string;
  origin: string;
  destination: string;
  expected_arrival: string;
  confidence_band: ConfidenceBand;
  factors: string[];
  delay_minutes: number;
}

export interface TerminalCongestion {
  terminal: string;
  name: string; // The endpoint returns full_name but I will map it
  current_rakes: number;
  capacity: number;
  alert_level: 'green' | 'yellow' | 'red';
  utilization_pct: number;
}

const delayFactorConfig: Record<string, { icon: React.ElementType; label: string }> = {
  weather: { icon: Cloud, label: 'Weather' },
  congestion: { icon: TrafficCone, label: 'Congestion' },
  signal: { icon: Radio, label: 'Signal' },
};

const alertLevelStyles: Record<string, { badge: string; bar: string }> = {
  green: { badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
  yellow: { badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
  red: { badge: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
};

const alertLevelLabel: Record<string, string> = {
  green: 'Normal',
  yellow: 'Elevated',
  red: 'Critical',
};

export default function FoisEtaTracker() {
  const [rakes, setRakes] = useState<RakeETA[]>([]);
  const [terminals, setTerminals] = useState<TerminalCongestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const congestionData = await fetchCongestion();
      setTerminals(congestionData.terminals || []);

      const allRakesRes = await fetchAllRakes();
      const activeRakeIds = (allRakesRes.rakes || []).map((r: any) => r.rake_id);

      if (activeRakeIds.length > 0) {
        const batchEtasRes = await fetchBatchEtas(activeRakeIds);
        setRakes(batchEtasRes.predictions || []);
      } else {
        setRakes([]);
      }

      const validTerminals = (congestionData.terminals || [])
        .map((t: any) => ({
          ...t,
          name: t.full_name || t.terminal,
          alert_level: t.alert_level.toLowerCase()
        }));
      
      setTerminals(validTerminals);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load FOIS data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const getStatus = (delay: number) => {
    if (delay > 60) return { label: 'Critical', style: 'bg-rose-50 text-rose-700' };
    if (delay > 15) return { label: 'Delayed', style: 'bg-amber-50 text-amber-700' };
    return { label: 'On Track', style: 'bg-emerald-50 text-emerald-700' };
  };

  return (
    <div className="space-y-6">
      {/* Tester Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-2">
            <Info className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-900">Feature Goal: Track Freight & Terminal Bottlenecks</h3>
            <p className="mt-1 text-sm leading-relaxed text-blue-800">
              <span className="font-semibold text-blue-900">How to test:</span> This dashboard integrates real-time freight location data and calculates predictive ETAs.
              Look at the <span className="font-semibold">Terminal Congestion</span> section to see live capacity metrics (e.g. Howrah Goods Shed showing high capacity in red).
              In the <span className="font-semibold">Live ETAs</span> table, you can see specific trains and the AI-identified factors causing their delays (like bad weather or network congestion). Click <span className="font-semibold">"Refresh"</span> to pull fresh backend data.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Train className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">FOIS Freight Tracker</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Live ETA predictions &amp; terminal congestion monitoring
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-8 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      {/* Interactive Map */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <InteractiveFoisMap rakes={rakes} terminals={terminals} />
      </div>

      {/* Rake ETA Cards */}
      <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {rakes.length === 0 && !loading && (
          <div className="col-span-full text-center text-slate-500 py-8">No active rakes found.</div>
        )}
        {rakes.map((rake) => {
          const status = getStatus(rake.delay_minutes);
          return (
            <div
              key={rake.rake_id}
              className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow"
            >
              {/* Rake header */}
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-800">{rake.rake_id}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.style}`}>
                  {status.label}
                </span>
              </div>

              {/* Route */}
              <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{rake.origin}</span>
                <span className="text-slate-400">→</span>
                <span className="truncate">{rake.destination}</span>
              </div>

              {/* ETA */}
              <div className="mb-3 flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600">ETA:</span>
                <span className="font-semibold text-slate-800">{new Date(rake.expected_arrival).toLocaleString()}</span>
              </div>

              {/* Confidence Band */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Confidence Band
                </p>
                <div className="flex h-2 w-full overflow-hidden rounded-full">
                  <div className="bg-blue-300" style={{ width: `${rake.confidence_band.early * 100}%` }} />
                  <div className="bg-emerald-400" style={{ width: `${rake.confidence_band.on_time * 100}%` }} />
                  <div className="bg-rose-400" style={{ width: `${rake.confidence_band.delayed * 100}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>Early</span>
                  <span>On Time</span>
                  <span>Delayed</span>
                </div>
              </div>

              {/* Delay Factors */}
              {rake.factors && rake.factors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rake.factors.map((factor) => {
                    const cfg = delayFactorConfig[factor] || { icon: Clock, label: factor };
                    const FactorIcon = cfg.icon;
                    return (
                      <span
                        key={factor}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 capitalize"
                      >
                        <FactorIcon className="h-3 w-3 text-slate-400" />
                        {cfg.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Congestion */}
      {terminals.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-8 rounded-b-xl">
          <div className="mb-5 flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">Terminal Congestion</h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {terminals.map((terminal) => {
              const styles = alertLevelStyles[terminal.alert_level] || alertLevelStyles.green;
              const alertLabel = alertLevelLabel[terminal.alert_level] || 'Normal';

              return (
                <div key={terminal.terminal} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800 truncate" title={terminal.name}>{terminal.name}</h4>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>
                      {alertLabel}
                    </span>
                  </div>
                  
                  <div className="mb-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-800 tracking-tight">{terminal.current_rakes}</span>
                    <span className="text-xs font-medium text-slate-500">/ {terminal.capacity} rakes</span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${Math.min(terminal.utilization_pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="px-6 py-2 text-right text-xs text-slate-400 bg-slate-50/50 rounded-b-xl">
        Last updated: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : '...'}
      </div>
      </div>
    </div>
  );
}
