'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RakeETA, TerminalCongestion } from './FoisEtaTracker';

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Train Icon (Using divIcon for custom SVG)
const createTrainIcon = () => {
  return L.divIcon({
    className: 'custom-train-icon bg-transparent border-none',
    html: `<div style="background-color: white; border: 2px solid #4f46e5; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Predefined terminal coordinates for prototype
const terminalCoords: Record<string, [number, number]> = {
  'TGLK': [28.5139, 77.2797], // Tughlakabad
  'JNPT': [18.9500, 72.9500], // JNPT Mumbai
  'Kandla': [23.0333, 70.2167], // Kandla Port
  'Mundra Port': [22.7380, 69.7100], // Mundra Port
  'Chennai Port': [13.0827, 80.2707], // Chennai
};

interface MapProps {
  rakes: RakeETA[];
  terminals: TerminalCongestion[];
}

export default function InteractiveFoisMap({ rakes, terminals }: MapProps) {
  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative shadow-sm">
      <MapContainer 
        center={[22.0, 78.0]} 
        zoom={4.5} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur p-3 rounded-lg shadow-md border border-slate-200 text-xs pointer-events-none">
          <h4 className="font-bold text-slate-800 mb-2">Map Legend</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white ring-1 ring-emerald-500"></div>
              <span className="text-slate-600 font-medium">Terminal (Normal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-white ring-1 ring-amber-500"></div>
              <span className="text-slate-600 font-medium">Terminal (Elevated)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 border border-white ring-1 ring-rose-500"></div>
              <span className="text-slate-600 font-medium">Terminal (Critical)</span>
            </div>
            <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-100">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>
              </div>
              <span className="text-slate-600 font-medium">Active Train</span>
            </div>
          </div>
        </div>

        {/* Terminals */}
        {terminals.map(terminal => {
          const coords = terminalCoords[terminal.name] || [20, 78]; // fallback
          // Color based on alert_level
          let color = '#3b82f6'; // blue default
          if (terminal.alert_level === 'critical' || terminal.alert_level === 'red') color = '#ef4444'; // red
          if (terminal.alert_level === 'elevated' || terminal.alert_level === 'yellow') color = '#f59e0b'; // amber
          if (terminal.alert_level === 'normal' || terminal.alert_level === 'green') color = '#10b981'; // emerald

          return (
            <CircleMarker 
              key={terminal.terminal}
              center={coords} 
              radius={8}
              fillColor={color}
              color="#ffffff"
              weight={2}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="text-sm font-sans">
                  <strong>{terminal.name}</strong><br/>
                  Capacity: {terminal.current_rakes}/{terminal.capacity} ({Math.round(terminal.utilization_pct)}%)<br/>
                  Status: <span className="uppercase text-xs font-bold">{terminal.alert_level}</span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Rakes (Trains) */}
        {rakes.map((rake, i) => {
          const destCoords = terminalCoords[rake.destination] || [28.6139, 77.2090];
          const lat = destCoords[0] + (Math.sin(i * 1.5) * 2);
          const lng = destCoords[1] + (Math.cos(i * 1.5) * 2);

          return (
            <Marker key={rake.rake_id} position={[lat, lng]} icon={createTrainIcon()}>
              <Popup>
                <div className="text-sm font-sans">
                  <strong>Train {rake.rake_id}</strong><br/>
                  Origin: {rake.origin}<br/>
                  Dest: {rake.destination}<br/>
                  Delay: {rake.delay_minutes} mins
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
