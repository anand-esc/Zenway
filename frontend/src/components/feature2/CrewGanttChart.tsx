import React from 'react';

export interface Shift {
  date: string; // YYYY-MM-DD
  type: 'day' | 'night' | 'off';
  hours: number;
}

interface CrewGanttChartProps {
  pilotId: string;
  shifts: Shift[];
}

export default function CrewGanttChart({ pilotId, shifts }: CrewGanttChartProps) {
  // Simple timeline representing the last 7 days
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700">7-Day Shift History (Pilot {pilotId})</h4>
        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-400"></div> Day</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-indigo-900"></div> Night</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-200"></div> Off</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-1 h-12">
          {shifts.map((shift, i) => {
            // Determine bar height based on hours
            const heightPct = Math.max((shift.hours / 12) * 100, 10);
            
            // Highlight back-to-back night shifts
            const isConsecutiveNight = shift.type === 'night' && i > 0 && shifts[i-1].type === 'night';
            
            let colorClass = 'bg-slate-200';
            if (shift.type === 'day') colorClass = 'bg-emerald-400';
            if (shift.type === 'night') colorClass = isConsecutiveNight ? 'bg-rose-500 animate-pulse' : 'bg-indigo-900';

            return (
              <div key={i} className="flex-1 h-full flex flex-col justify-end group relative cursor-help">
                <div 
                  className={`w-full rounded-t-sm transition-all ${colorClass}`}
                  style={{ height: `${heightPct}%` }}
                />
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                  {shift.date}: {shift.hours} hrs ({shift.type})
                  {isConsecutiveNight && <div className="text-rose-400 font-bold">Consecutive Night!</div>}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* X-axis labels */}
        <div className="flex gap-1 mt-2">
          {shifts.map((shift, i) => {
            const dateStr = shift.date.split('-').slice(1).join('/'); // MM/DD
            return (
              <div key={i} className="flex-1 text-center text-[9px] font-medium text-slate-400">
                {dateStr}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
