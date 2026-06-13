'use client';

import React, { useState, useEffect } from 'react';
import {
  Train,
  Navigation,
  Utensils,
  Camera,
  Coffee,
  AlertCircle,
  Search,
  ChevronDown,
  Loader2,
  Volume2,
  ShieldCheck,
  Info,
  Sparkles,
} from 'lucide-react';
import ItineraryTimelineItem from './ItineraryTimelineItem';
import type { ItineraryTimelineItemProps } from './ItineraryTimelineItem';
import { fetchStations, fetchLanguages, generateItinerary } from '../../services/api';

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

export default function LayoverConcierge() {
  const [stations, setStations] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  
  const [pnr, setPnr] = useState('');
  const [language, setLanguage] = useState('en'); // Use codes like 'en', 'hi'
  const [stationName, setStationName] = useState('New Delhi');
  
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layoverHours, setLayoverHours] = useState<number>(4);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [stationsRes, langRes] = await Promise.all([
          fetchStations(),
          fetchLanguages()
        ]);
        setStations(stationsRes.stations);
        setLanguages(langRes.languages);
        if (langRes.languages.length > 0) {
          setLanguage(langRes.languages[0].code);
        }
      } catch (err) {
        console.error('Failed to load initial options', err);
      }
    }
    loadOptions();
  }, []);

  const handleGenerate = async () => {
    if (pnr.length !== 10) return;
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const res = await generateItinerary(pnr, stationName, language, layoverHours);
      
      const mappedActivities = res.activities.map((a: any) => ({
        timeSlot: `Minute ${a.start_minute} - ${a.start_minute + a.duration_minutes}`,
        title: a.name,
        description: a.description || '',
        category: a.type,
        distanceKm: a.distance_km,
        walkingMinutes: Math.round(a.distance_km * 12),
      }));

      setItinerary({
        stationName: `${res.station_name} (${res.station_code})`,
        layoverWindow: `Layover (${layoverHours}h)`,
        activities: mappedActivities
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate itinerary');
    } finally {
      setIsLoading(false);
    }
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
            <h3 className="text-base font-bold text-blue-900">Feature Goal: Enhance Passenger Wait Times</h3>
            <p className="mt-1 text-sm leading-relaxed text-blue-800">
              <span className="font-semibold text-blue-900">How to test:</span> This feature turns boring layovers into city experiences!
              Enter any 10-digit PNR (e.g., <span className="font-mono">1234567890</span>) and select a language. 
              Click <span className="font-semibold">"Generate Itinerary"</span>. The AI analyzes the layover duration, filters nearby food/attractions within a safe geofence radius, and builds a strict timeline. 
              Click the <span className="font-semibold">Speaker Button</span> at the top right of the generated itinerary to hear the simulated Bhashini Voice Announcement!
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-900/5">
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
        <div className="space-y-5 border-b border-slate-100 px-8 py-6">
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

          {/* Station Selection (For Demo) */}
          {stations.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Layover Station (Demo Override)
              </label>
              <div className="relative">
                <select
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-800 transition-all duration-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {stations.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          {/* Language Selector */}
          {languages.length > 0 && (
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
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          {/* Simulate Delay (AI Feature) */}
          <div className="pt-2">
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
              <span>Simulate Train Delay</span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">AI Recalculation</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLayoverHours(4)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${layoverHours === 4 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                On Time (4 Hrs)
              </button>
              <button
                onClick={() => setLayoverHours(6)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${layoverHours === 6 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                +2 Hr Delay
              </button>
              <button
                onClick={() => setLayoverHours(8)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${layoverHours === 8 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                +4 Hr Delay
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Clicking a delay will regenerate the itinerary to intelligently fill the extra time.
            </p>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

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
              <>
                <Sparkles className="h-4 w-4" />
                Generate Itinerary
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {itinerary && (
          <div className="px-8 py-6">
            {/* Station header */}
            <div className="mb-5 flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-900">{itinerary.stationName}</h3>
                <p className="mt-0.5 text-xs text-indigo-600">
                  {itinerary.layoverWindow}
                </p>
              </div>
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel(); // stop previous
                    const activitiesText = itinerary.activities.map(a => a.title).join(". Then, ");
                    const utterance = new SpeechSynthesisUtterance(
                      `Here is your Bhashini generated layover itinerary. First, ${activitiesText}. Have a safe journey!`
                    );
                    window.speechSynthesis.speak(utterance);
                  } else {
                    alert("Text-to-speech is not supported in your browser.");
                  }
                }}
                className="flex shrink-0 items-center justify-center h-10 w-10 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                title="Play Bhashini Voice Announcement"
              >
                <Volume2 className="h-5 w-5" />
              </button>
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
    </div>
  );
}
