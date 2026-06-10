'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  Users,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export interface PilotData {
  id: string;
  name: string;
  currentRoute: string;
  shiftHours: number;
  consecutiveDays: number;
  fatigueScore: number;
  status: 'Active' | 'Resting' | 'Standby' | 'On Leave';
}

export interface CrewPulseDashboardProps {
  pilots?: PilotData[];
  onRequestSwap?: (pilotId: string) => void;
  onRefresh?: () => void;
}

const defaultPilots: PilotData[] = [
  { id: 'LP-1021', name: 'Rajesh Kumar Singh', currentRoute: 'Rajdhani Exp Delhi-Mumbai', shiftHours: 9.5, consecutiveDays: 5, fatigueScore: 82, status: 'Active' },
  { id: 'LP-1034', name: 'Anil Sharma', currentRoute: 'Shatabdi Exp Chennai-Bengaluru', shiftHours: 7, consecutiveDays: 3, fatigueScore: 45, status: 'Active' },
  { id: 'LP-1042', name: 'Vikram Patel', currentRoute: 'Duronto Exp Howrah-Delhi', shiftHours: 10, consecutiveDays: 6, fatigueScore: 91, status: 'Active' },
  { id: 'LP-1055', name: 'Suresh Reddy', currentRoute: 'Garib Rath Secunderabad-Mumbai', shiftHours: 6, consecutiveDays: 2, fatigueScore: 28, status: 'Active' },
  { id: 'LP-1063', name: 'Manoj Tiwari', currentRoute: 'Vande Bharat Varanasi-Delhi', shiftHours: 8, consecutiveDays: 4, fatigueScore: 63, status: 'Active' },
  { id: 'LP-1078', name: 'Pradeep Yadav', currentRoute: 'Humsafar Exp Patna-Delhi', shiftHours: 5, consecutiveDays: 1, fatigueScore: 18, status: 'Standby' },
  { id: 'LP-1089', name: 'Sanjay Mishra', currentRoute: 'Tejas Exp Lucknow-Delhi', shiftHours: 11, consecutiveDays: 7, fatigueScore: 88, status: 'Active' },
  { id: 'LP-1095', name: 'Deepak Nair', currentRoute: 'Jan Shatabdi Kochi-Thrissur', shiftHours: 4, consecutiveDays: 2, fatigueScore: 35, status: 'Resting' },
];

function fatigueBadge(score: number) {
  if (score <= 40) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        {score}
      </span>
    );
  }
  if (score <= 70) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        {score}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
      {score}
    </span>
  );
}

function statusBadge(status: PilotData['status']) {
  const styles: Record<PilotData['status'], string> = {
    Active: 'bg-emerald-50 text-emerald-700',
    Resting: 'bg-blue-50 text-blue-700',
    Standby: 'bg-amber-50 text-amber-700',
    'On Leave': 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function CrewPulseDashboard({
  pilots = defaultPilots,
  onRequestSwap = () => {},
  onRefresh = () => {},
}: CrewPulseDashboardProps) {
  const totalActive = pilots.filter((p) => p.status === 'Active').length;
  const highFatigueCount = pilots.filter((p) => p.fatigueScore > 70).length;
  const pendingSwaps = pilots.filter((p) => p.fatigueScore > 80).length;
  const criticalPilots = pilots.filter((p) => p.fatigueScore > 80);

  const stats = [
    { label: 'Total Active Crew', value: totalActive, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'High Fatigue', value: highFatigueCount, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Pending Swaps', value: pendingSwaps, icon: ArrowRightLeft, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Shift Hours', value: (pilots.reduce((a, p) => a + p.shiftHours, 0) / pilots.length).toFixed(1), icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Alert Banner */}
      {criticalPilots.length > 0 && (
        <div className="flex items-center gap-3 rounded-t-xl border-b border-rose-100 bg-rose-50/80 px-8 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-800">
            <span className="font-semibold">{criticalPilots.length} pilot{criticalPilots.length > 1 ? 's' : ''}</span>{' '}
            with fatigue score &gt; 80 — immediate swap recommended:{' '}
            {criticalPilots.map((p) => p.name).join(', ')}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Crew Pulse Monitor</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time fatigue tracking &amp; roster management for loco pilots
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-6 px-8 py-6 lg:grid-cols-4 bg-slate-50/50 border-b border-slate-100">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col rounded-xl bg-white p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-slate-500">
                {stat.label}
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-800 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pilot ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Route
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Shift Hrs
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Consec. Days
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fatigue
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pilots.map((pilot) => (
              <tr
                key={pilot.id}
                className="transition-all duration-200 hover:bg-slate-50/60 group"
              >
                <td className="px-3 py-5 text-sm font-mono font-medium text-slate-600">
                  {pilot.id}
                </td>
                <td className="px-3 py-5 text-sm font-medium text-slate-800">
                  {pilot.name}
                </td>
                <td className="px-3 py-5 text-sm text-slate-500">
                  {pilot.currentRoute}
                </td>
                <td className="px-3 py-5 text-right text-sm text-slate-600">
                  {pilot.shiftHours}h
                </td>
                <td className="px-3 py-5 text-right text-sm text-slate-600">
                  {pilot.consecutiveDays}
                </td>
                <td className="px-3 py-5 text-center">
                  {fatigueBadge(pilot.fatigueScore)}
                </td>
                <td className="px-3 py-5 text-center">
                  {statusBadge(pilot.status)}
                </td>
                <td className="px-3 py-5 text-right">
                  <button
                    onClick={() => onRequestSwap(pilot.id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 shadow-sm border border-slate-200 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Request Swap
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
