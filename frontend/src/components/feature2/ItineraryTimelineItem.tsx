'use client';

import React from 'react';
import {
  Utensils,
  Camera,
  BedDouble,
  Stethoscope,
  ShoppingBag,
  Footprints,
  MapPin,
} from 'lucide-react';

export interface ItineraryTimelineItemProps {
  timeSlot: string;
  title: string;
  description: string;
  category: string;
  distanceKm: number;
  walkingMinutes: number;
  isLast?: boolean;
}

const categoryConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  food: { icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  sightseeing: { icon: Camera, color: 'text-blue-600', bg: 'bg-blue-50' },
  attraction: { icon: Camera, color: 'text-blue-600', bg: 'bg-blue-50' },
  rest: { icon: BedDouble, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  medical: { icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-50' },
  shopping: { icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  default: { icon: MapPin, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export default function ItineraryTimelineItem({
  timeSlot,
  title,
  description,
  category,
  distanceKm,
  walkingMinutes,
  isLast = false,
}: ItineraryTimelineItemProps) {
  const config = categoryConfig[category] || categoryConfig['default'];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 bg-white">
          <div className="h-3 w-3 rounded-full bg-indigo-500" />
        </div>
        {!isLast && (
          <div className="w-0.5 grow bg-slate-200" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-10 w-full ${isLast ? 'pb-0' : ''}`}>
        {/* Time badge */}
        <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {timeSlot}
        </span>

        {/* Activity card */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow">
          <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
              <Icon className={`h-4.5 w-4.5 ${config.color}`} size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                {description}
              </p>

              {/* Meta badges */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  <MapPin size={12} className="text-slate-400" />
                  {distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  <Footprints size={12} className="text-slate-400" />
                  {walkingMinutes} min walk
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
