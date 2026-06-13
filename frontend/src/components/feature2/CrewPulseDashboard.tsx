'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  Users,
  Clock,
  ShieldAlert,
  Loader2,
  Info
} from 'lucide-react';
import { fetchCrewAlerts, requestCrewSwap } from '../../services/api';
import RosterSwapModal, { ReplacementPilotInfo } from './RosterSwapModal';

import CrewGanttChart from './CrewGanttChart';

export interface PilotData {
  pilot_id: string;
  name: string;
  home_station: string;
  consecutive_days_on_duty: number;
  fatigue_score: number;
  risk_level: string;
}

export default function CrewPulseDashboard() {
  const [pilots, setPilots] = useState<PilotData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingSwaps, setProcessingSwaps] = useState<Record<string, boolean>>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedPilotId, setExpandedPilotId] = useState<string | null>(null);

  const generateMockShifts = (pilot: PilotData) => {
    const shifts: any[] = [];
    const today = new Date('2026-06-13'); // Fixed mock today date
    const consecutive = pilot.consecutive_days_on_duty;
    const isHighFatigue = pilot.fatigue_score > 75;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // If within consecutive days, assign a shift
      if (6 - i < consecutive) {
        // High fatigue gets more night shifts and longer hours
        const type = isHighFatigue && (i % 2 === 0 || i === 1) ? 'night' : 'day';
        const baseHours = isHighFatigue ? 10 : 8;
        const hours = baseHours + Math.floor(Math.random() * 3); // 8-10 or 10-12
        
        shifts.push({ date: dateStr, type, hours });
      } else {
        shifts.push({ date: dateStr, type: 'off', hours: 0 });
      }
    }
    return shifts;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCrewAlerts(0);
      setPilots(data.alerts);
      setLastRefreshed(new Date(data.generated_at || Date.now()));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load crew data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<PilotData | null>(null);

  const handleOpenSwapModal = (pilot: PilotData) => {
    setSelectedPilot(pilot);
    setIsModalOpen(true);
  };

  const handleConfirmSwap = async (replacementPilot: ReplacementPilotInfo) => {
    setIsModalOpen(false);
    if (!selectedPilot) return;
    
    const pilotId = selectedPilot.pilot_id;
    setProcessingSwaps(prev => ({ ...prev, [pilotId]: true }));
    try {
      await requestCrewSwap(pilotId);
      // Simulate backend completion to update UI
      setTimeout(() => {
        setProcessingSwaps(prev => ({ ...prev, [pilotId]: false }));
        // Update local pilots state to reflect the swap
        setPilots(prevPilots => 
          prevPilots.map(p => 
            p.pilot_id === pilotId 
              ? {
                  ...p,
                  pilot_id: replacementPilot.id,
                  name: replacementPilot.name,
                  fatigue_score: replacementPilot.fatigueScore,
                  risk_level: 'low',
                  consecutive_days_on_duty: 0,
                }
              : p
          )
        );
      }, 3000);
    } catch (err: any) {
      alert(`Error requesting swap: ${err.message}`);
      setProcessingSwaps(prev => ({ ...prev, [pilotId]: false }));
    }
  };
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

  function statusBadge(risk: string) {
    const styles: Record<string, string> = {
      low: 'bg-emerald-50 text-emerald-700',
      moderate: 'bg-blue-50 text-blue-700',
      high: 'bg-amber-50 text-amber-700',
      critical: 'bg-rose-50 text-rose-700',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${styles[risk] || 'bg-slate-100 text-slate-600'}`}>
        {risk}
      </span>
    );
  }

  const totalActive = pilots.length;
  const highFatigueCount = pilots.filter((p) => p.fatigue_score > 70).length;
  const pendingSwaps = pilots.filter((p) => p.fatigue_score > 80).length;
  const criticalPilots = pilots.filter((p) => p.fatigue_score > 80);

  const stats = [
    { label: 'Total Active Crew', value: totalActive, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'High Fatigue', value: highFatigueCount, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Pending Swaps', value: pendingSwaps, icon: ArrowRightLeft, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Consec. Days', value: pilots.length ? (pilots.reduce((a, p) => a + p.consecutive_days_on_duty, 0) / pilots.length).toFixed(1) : '0', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Tester Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-2">
            <Info className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-900">Feature Goal: Monitor & Manage Crew Fatigue</h3>
            <p className="mt-1 text-sm leading-relaxed text-blue-800">
              <span className="font-semibold text-blue-900">How to test:</span> This dashboard fetches real-time pilot fatigue data from the backend.
              Look for pilots with critical fatigue scores (highlighted in red). Click the <span className="font-semibold">"Request Swap"</span> button 
              to trigger the intelligent Roster Swap system. Select an alternative rested driver from the modal and confirm. 
              The system will dynamically update the table to reflect the newly swapped pilot!
            </p>
          </div>
        </div>
      </div>

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
            Real-time fatigue tracking &amp; roster management (Auto-refreshes every 30s)
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

      {/* Error State */}
      {error && (
        <div className="px-8 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

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
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pilot ID</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Home Station</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Consec. Days</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Fatigue Score</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Level</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pilots.map((pilot) => (
              <React.Fragment key={pilot.pilot_id}>
                <tr 
                  className={`transition-all duration-200 hover:bg-slate-50/60 group cursor-pointer ${expandedPilotId === pilot.pilot_id ? 'bg-slate-50/60' : ''}`}
                  onClick={() => setExpandedPilotId(expandedPilotId === pilot.pilot_id ? null : pilot.pilot_id)}
                >
                  <td className="px-3 py-5 text-sm font-mono font-medium text-slate-600">{pilot.pilot_id}</td>
                  <td className="px-3 py-5 text-sm font-medium text-slate-800">{pilot.name}</td>
                  <td className="px-3 py-5 text-sm text-slate-500">{pilot.home_station}</td>
                  <td className="px-3 py-5 text-right text-sm text-slate-600">{pilot.consecutive_days_on_duty}</td>
                  <td className="px-3 py-5 text-center">{fatigueBadge(pilot.fatigue_score)}</td>
                  <td className="px-3 py-5 text-center">{statusBadge(pilot.risk_level)}</td>
                  <td className="px-3 py-5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenSwapModal(pilot); }}
                      disabled={processingSwaps[pilot.pilot_id]}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 ${
                        processingSwaps[pilot.pilot_id]
                          ? 'border-amber-200 bg-amber-50 text-amber-600'
                          : 'border-slate-200 bg-white text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      {processingSwaps[pilot.pilot_id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRightLeft className="h-3 w-3" />}
                      {processingSwaps[pilot.pilot_id] ? 'Processing...' : 'Request Swap'}
                    </button>
                  </td>
                </tr>
                {expandedPilotId === pilot.pilot_id && (
                  <tr>
                    <td colSpan={7} className="px-3 pb-5 pt-0 bg-slate-50/60">
                      <CrewGanttChart 
                        pilotId={pilot.pilot_id} 
                        shifts={generateMockShifts(pilot)} 
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {pilots.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                  No crew data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-2 text-right text-xs text-slate-400">
        Last updated: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : '...'}
      </div>

      {isModalOpen && selectedPilot && (
        <RosterSwapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmSwap}
          fatiguedPilot={{
            id: selectedPilot.pilot_id,
            name: selectedPilot.name,
            currentRoute: 'Assigned Route',
            fatigueScore: selectedPilot.fatigue_score,
            shiftHours: Math.round(selectedPilot.consecutive_days_on_duty * 8),
            consecutiveDays: selectedPilot.consecutive_days_on_duty,
          }}
        />
      )}
      </div>
    </div>
  );
}
