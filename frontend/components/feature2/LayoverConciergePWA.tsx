'use client';

import React, { useState } from 'react';
import {
  Train,
  Search,
  ChevronDown,
  MapPin,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import ItineraryTimelineItem from './ItineraryTimelineItem';
import type { ItineraryTimelineItemProps } from './ItineraryTimelineItem';

export interface ItineraryActivity {
  timeSlot: string;
  title: string;
  description: string;
  category: ItineraryTimelineItemProps['category'];
  distanceKm: number;
  walkingMinutes: number;
}

export interface ItineraryData {
  stationName: string;
  layoverWindow: string;
  activities: ItineraryActivity[];
}

export interface LayoverConciergePWAProps {
  onGenerateItinerary?: (pnr: string, language: string) => void;
  itinerary?: ItineraryData | null;
  isLoading?: boolean;
}

const languages = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Kannada',
];

const defaultItinerary: ItineraryData = {
  stationName: 'New Delhi (NDLS)',
  layoverWindow: '10:00 AM – 3:30 PM (5h 30m)',
  activities: [
    {
      timeSlot: '10:15 – 11:00',
      title: 'Visit Connaught Place',
      description:
        'Explore the iconic colonial-era shopping district with its Georgian architecture and vibrant markets.',
      category: 'sightseeing',
      distanceKm: 1.2,
      walkingMinutes: 15,
    },
    {
      timeSlot: '11:15 – 12:00',
      title: 'Try street food at Chandni Chowk',
      description:
        'Sample legendary paranthas at Paranthe Wali Gali and jalebis at Old Famous Jalebi Wala.',
      category: 'food',
      distanceKm: 3.5,
      walkingMinutes: 8,
    },
    {
      timeSlot: '12:15 – 13:00',
      title: 'Rest at Retiring Room',
      description:
        'Refresh at the IRCTC retiring room on Platform 1. Hot shower and recliner available.',
      category: 'rest',
      distanceKm: 0.1,
      walkingMinutes: 2,
    },
    {
      timeSlot: '13:15 – 14:00',
      title: 'Visit Janpath Market',
      description:
        'Pick up handicrafts, fabrics, and souvenirs from this popular open-air market.',
      category: 'shopping',
      distanceKm: 1.0,
      walkingMinutes: 12,
    },
    {
      timeSlot: '14:15 – 14:45',
      title: 'Station Medical Check',
      description:
        'Quick BP and sugar check at the free railway health kiosk near Gate 2.',
      category: 'medical',
      distanceKm: 0.05,
      walkingMinutes: 1,
    },
  ],
};

export default function LayoverConciergePWA({
  onGenerateItinerary = () => {},
  itinerary = defaultItinerary,
  isLoading = false,
}: LayoverConciergePWAProps) {
  const [pnr, setPnr] = useState('');
  const [language, setLanguage] = useState('English');

  const mockStation = pnr.length === 10 ? 'New Delhi (NDLS)' : '';
  const mockLayover = pnr.length === 10 ? '5h 30m' : '';

  const handleGenerate = () => {
    if (pnr.length === 10) {
      onGenerateItinerary(pnr, language);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Train className="h-6 w-6 text-white" />
            <h2 className="text-lg font-bold text-white">Layover Concierge</h2>
          </div>
          <p className="mt-1 text-sm text-indigo-200">
            Your personal guide during train layovers
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4 border-b border-slate-200 px-6 py-5">
          {/* PNR Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              PNR Number
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit PNR"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Preferred Language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-800 transition-all duration-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Auto-detected Station & Layover */}
          {pnr.length === 10 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <span className="text-slate-500">Station:</span>
                <span className="font-semibold text-slate-800">{mockStation}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span className="text-slate-500">Layover:</span>
                <span className="font-semibold text-slate-800">{mockLayover}</span>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={pnr.length !== 10 || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Itinerary'
            )}
          </button>
        </div>

        {/* Results Section */}
        {itinerary && (
          <div className="px-6 py-5">
            {/* Station header */}
            <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <h3 className="text-sm font-bold text-indigo-900">{itinerary.stationName}</h3>
              <p className="mt-0.5 text-xs text-indigo-600">
                Layover: {itinerary.layoverWindow}
              </p>
            </div>

            {/* Timeline */}
            <div>
              {itinerary.activities.map((activity, idx) => (
                <ItineraryTimelineItem
                  key={idx}
                  timeSlot={activity.timeSlot}
                  title={activity.title}
                  description={activity.description}
                  category={activity.category}
                  distanceKm={activity.distanceKm}
                  walkingMinutes={activity.walkingMinutes}
                  isLast={idx === itinerary.activities.length - 1}
                />
              ))}
            </div>

            {/* Safety Notice */}
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-800">
                <span className="font-semibold">Safety Notice:</span> You will receive a geofence
                alert 30 minutes before your departure. Stay within the recommended radius to ensure
                you don&apos;t miss your train.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
