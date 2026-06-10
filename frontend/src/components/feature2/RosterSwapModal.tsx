'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  AlertTriangle,
  ShieldCheck,
  Clock,
  MapPin,
  Award,
} from 'lucide-react';

export interface PilotSwapInfo {
  id: string;
  name: string;
  currentRoute: string;
  fatigueScore: number;
  shiftHours: number;
  consecutiveDays: number;
}

export interface ReplacementPilotInfo {
  id: string;
  name: string;
  fatigueScore: number;
  station: string;
  availabilityEta: string;
  certificationLevel: 'A1' | 'A2' | 'B1' | 'B2';
}

export interface ValidationRule {
  rule: string;
  passed: boolean;
}

export interface ValidationResult {
  overallPass: boolean;
  rules: ValidationRule[];
}

export interface RosterSwapModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (swapId: string) => void;
  fatiguedPilot?: PilotSwapInfo;
  replacementPilot?: ReplacementPilotInfo;
  validationResult?: ValidationResult;
}

const defaultFatiguedPilot: PilotSwapInfo = {
  id: 'LP-1021',
  name: 'Rajesh Kumar Singh',
  currentRoute: 'Rajdhani Exp Delhi-Mumbai',
  fatigueScore: 82,
  shiftHours: 9.5,
  consecutiveDays: 5,
};

const defaultReplacementPilot: ReplacementPilotInfo = {
  id: 'LP-2047',
  name: 'Abhishek Verma',
  fatigueScore: 22,
  station: 'New Delhi Loco Shed',
  availabilityEta: '35 minutes',
  certificationLevel: 'A1',
};

const defaultValidationResult: ValidationResult = {
  overallPass: true,
  rules: [
    { rule: 'Minimum 12-hour rest period met', passed: true },
    { rule: 'Route certification verified', passed: true },
    { rule: 'Medical fitness certificate valid', passed: true },
    { rule: 'Consecutive duty limit not exceeded', passed: true },
    { rule: 'Union notification window satisfied', passed: false },
  ],
};

export default function RosterSwapModal({
  isOpen = true,
  onClose = () => {},
  onConfirm = () => {},
  fatiguedPilot = defaultFatiguedPilot,
  replacementPilot = defaultReplacementPilot,
  validationResult = defaultValidationResult,
}: RosterSwapModalProps) {
  if (!isOpen) return null;

  const swapId = `SWAP-${fatiguedPilot.id}-${replacementPilot.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Roster Swap Proposal</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Fatigued Pilot */}
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-semibold text-rose-800">Fatigued Pilot</h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Name</span>
                <span className="text-sm font-medium text-slate-800">{fatiguedPilot.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">ID</span>
                <span className="font-mono text-sm text-slate-700">{fatiguedPilot.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Fatigue Score</span>
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                  {fatiguedPilot.fatigueScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Shift Hours</span>
                <span className="text-sm font-medium text-slate-800">{fatiguedPilot.shiftHours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Consecutive Days</span>
                <span className="text-sm font-medium text-slate-800">{fatiguedPilot.consecutiveDays}</span>
              </div>
            </div>
          </div>

          {/* Replacement Pilot */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-emerald-800">Recommended Replacement</h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Name</span>
                <span className="text-sm font-medium text-slate-800">{replacementPilot.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">ID</span>
                <span className="font-mono text-sm text-slate-700">{replacementPilot.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Fatigue Score</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {replacementPilot.fatigueScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  <MapPin className="mr-1 inline h-3.5 w-3.5" />
                  Station
                </span>
                <span className="text-sm font-medium text-slate-800">{replacementPilot.station}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  <Clock className="mr-1 inline h-3.5 w-3.5" />
                  Availability ETA
                </span>
                <span className="text-sm font-medium text-slate-800">{replacementPilot.availabilityEta}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  <Award className="mr-1 inline h-3.5 w-3.5" />
                  Certification
                </span>
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  Level {replacementPilot.certificationLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Rules */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Rules Validation</h3>
            <ul className="space-y-2">
              {validationResult.rules.map((rule, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  {rule.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span
                    className={`text-sm ${
                      rule.passed ? 'text-slate-600' : 'font-medium text-rose-700'
                    }`}
                  >
                    {rule.rule}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(swapId)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow"
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
}
