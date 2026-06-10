'use client';

import React from 'react';
import {
  RefreshCw,
  Train,
  MapPin,
  Cloud,
  TrafficCone,
  Radio,
  Clock,
  Container,
  AlertTriangle,
  Warehouse,
} from 'lucide-react';

export interface RakeETA {
  rakeId: string;
  origin: string;
  destination: string;
  expectedArrival: string;
  confidence: {
    early: number;
    onTime: number;
    delayed: number;
  };
  delayFactors: string[];
  status: 'On Track' | 'Delayed' | 'Critical';
}

export interface TerminalCongestion {
  id: string;
  name: string;
  currentRakes: number;
  capacity: number;
  alertLevel: 'green' | 'yellow' | 'red';
}

export interface FoisEtaTrackerProps {
  rakes?: RakeETA[];
  terminals?: TerminalCongestion[];
  onRefresh?: () => void;
}

const defaultRakes: RakeETA[] = [
  {
    rakeId: 'BCNA-41025',
    origin: 'Mundra Port',
    destination: 'ICD Tughlakabad',
    expectedArrival: '14:30 IST',
    confidence: { early: 10, onTime: 65, delayed: 25 },
    delayFactors: ['congestion'],
    status: 'On Track',
  },
  {
    rakeId: 'BOXN-73418',
    origin: 'Talcher Coalfields',
    destination: 'NTPC Farakka',
    expectedArrival: '18:15 IST',
    confidence: { early: 5, onTime: 30, delayed: 65 },
    delayFactors: ['weather', 'signal'],
    status: 'Delayed',
  },
  {
    rakeId: 'BTPN-55210',
    origin: 'IOCL Mathura Refinery',
    destination: 'Kanpur POL Terminal',
    expectedArrival: '11:45 IST',
    confidence: { early: 20, onTime: 70, delayed: 10 },
    delayFactors: [],
    status: 'On Track',
  },
  {
    rakeId: 'BCNA-62034',
    origin: 'JNPT Mumbai',
    destination: 'ICD Nagpur',
    expectedArrival: '22:00 IST',
    confidence: { early: 2, onTime: 18, delayed: 80 },
    delayFactors: ['weather', 'congestion', 'signal'],
    status: 'Critical',
  },
  {
    rakeId: 'BOXN-88712',
    origin: 'Visakhapatnam Port',
    destination: 'Rourkela Steel Plant',
    expectedArrival: '16:00 IST',
    confidence: { early: 15, onTime: 60, delayed: 25 },
    delayFactors: ['congestion'],
    status: 'On Track',
  },
];

const defaultTerminals: TerminalCongestion[] = [
  { id: 'T1', name: 'Mundra Port', currentRakes: 18, capacity: 25, alertLevel: 'yellow' },
  { id: 'T2', name: 'JNPT Mumbai', currentRakes: 22, capacity: 24, alertLevel: 'red' },
  { id: 'T3', name: 'Visakhapatnam Port', currentRakes: 10, capacity: 20, alertLevel: 'green' },
  { id: 'T4', name: 'Haldia Dock Complex', currentRakes: 14, capacity: 18, alertLevel: 'yellow' },
  { id: 'T5', name: 'Chennai Port', currentRakes: 8, capacity: 22, alertLevel: 'green' },
];

const delayFactorConfig: Record<string, { icon: React.ElementType; label: string }> = {
  weather: { icon: Cloud, label: 'Weather' },
  congestion: { icon: TrafficCone, label: 'Congestion' },
  signal: { icon: Radio, label: 'Signal' },
};

const statusStyles: Record<RakeETA['status'], string> = {
  'On Track': 'bg-emerald-50 text-emerald-700',
  Delayed: 'bg-amber-50 text-amber-700',
  Critical: 'bg-rose-50 text-rose-700',
};

const alertLevelStyles: Record<TerminalCongestion['alertLevel'], { badge: string; bar: string }> = {
  green: { badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
  yellow: { badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
  red: { badge: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
};

const alertLevelLabel: Record<TerminalCongestion['alertLevel'], string> = {
  green: 'Normal',
  yellow: 'Elevated',
  red: 'Critical',
};

export default function FoisEtaTracker({
  rakes = defaultRakes,
  terminals = defaultTerminals,
  onRefresh = () => {},
}: FoisEtaTrackerProps) {
  return (
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
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Rake ETA Cards */}
      <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {rakes.map((rake) => (
          <div
            key={rake.rakeId}
            className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow"
          >
            {/* Rake header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-slate-800">{rake.rakeId}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[rake.status]}`}
              >
                {rake.status}
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
              <span className="font-semibold text-slate-800">{rake.expectedArrival}</span>
            </div>

            {/* Confidence Band */}
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                Confidence Band
              </p>
              <div className="flex h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-blue-300"
                  style={{ width: `${rake.confidence.early}%` }}
                />
                <div
                  className="bg-emerald-400"
                  style={{ width: `${rake.confidence.onTime}%` }}
                />
                <div
                  className="bg-rose-400"
                  style={{ width: `${rake.confidence.delayed}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>Early</span>
                <span>On Time</span>
                <span>Delayed</span>
              </div>
            </div>

            {/* Delay Factors */}
            {rake.delayFactors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {rake.delayFactors.map((factor) => {
                  const cfg = delayFactorConfig[factor];
                  if (!cfg) return null;
                  const FactorIcon = cfg.icon;
                  return (
                    <span
                      key={factor}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      <FactorIcon className="h-3 w-3 text-slate-400" />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Terminal Congestion */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-8 rounded-b-xl">
        <div className="mb-5 flex items-center gap-2">
          <Warehouse className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-800">Terminal Congestion</h3>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {terminals.map((terminal) => {
            const utilization = Math.round((terminal.currentRakes / terminal.capacity) * 100);
            const styles = alertLevelStyles[terminal.alertLevel];

            return (
              <div
                key={terminal.id}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">{terminal.name}</h4>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles.badge}`}
                  >
                    {alertLevelLabel[terminal.alertLevel]}
                  </span>
                </div>

                <p className="mb-2 text-sm text-slate-500">
                  <Container className="mr-1 inline h-3.5 w-3.5" />
                  {terminal.currentRakes} / {terminal.capacity} rakes
                </p>

                {/* Utilization bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs font-medium text-slate-500">{utilization}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
