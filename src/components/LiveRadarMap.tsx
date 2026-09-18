import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Shield, 
  Home, 
  AlertTriangle, 
  Layers, 
  Eye, 
  Navigation, 
  Users, 
  Heart, 
  Activity, 
  CheckCircle,
  Crosshair
} from 'lucide-react';
import { Incident, Volunteer, Shelter, PriorityLevel } from '../types.ts';

interface LiveRadarMapProps {
  incidents: Incident[];
  volunteers: Volunteer[];
  shelters: Shelter[];
  onSelectIncident: (inc: Incident) => void;
  onSelectVolunteer: (vol: Volunteer) => void;
}

export const LiveRadarMap: React.FC<LiveRadarMapProps> = ({
  incidents,
  volunteers,
  shelters,
  onSelectIncident,
  onSelectVolunteer,
}) => {
  const [showIncidents, setShowIncidents] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [radarSweep, setRadarSweep] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Map coordinate bounds for Bay Area disaster sector
  // Approx: lat 37.74 to 37.81, lng -122.45 to -122.40
  const minLat = 37.745;
  const maxLat = 37.810;
  const minLng = -122.455;
  const maxLng = -122.400;

  // Convert GPS coordinates to 1000x700 SVG canvas coordinates
  const getCoords = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 900 + 50;
    // Invert Y because SVG coordinates increase downwards
    const y = ((maxLat - lat) / (maxLat - minLat)) * 580 + 60;
    return { x: Math.max(30, Math.min(970, x)), y: Math.max(30, Math.min(670, y)) };
  };

  return (
    <div className="space-y-4">
      {/* Map Control Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
              TACTICAL EMERGENCY GEOMAP
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                LIVE GPS TELEMETRY
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Sector 4 Metro Waterfront • Flood Level: 4.2ft • Satellite Uplink Operational
            </p>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              showIncidents 
                ? 'bg-rose-950/70 border-rose-500 text-rose-200' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Incidents ({incidents.filter(i => i.status !== 'RESOLVED').length})</span>
          </button>

          <button
            onClick={() => setShowVolunteers(!showVolunteers)}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              showVolunteers 
                ? 'bg-blue-950/70 border-blue-500 text-blue-200' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Responders ({volunteers.length})</span>
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              showShelters 
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Shelters ({shelters.length})</span>
          </button>

          <button
            onClick={() => setRadarSweep(!radarSweep)}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              radarSweep 
                ? 'bg-amber-950/70 border-amber-500 text-amber-200' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Radar Sweep</span>
          </button>
        </div>
      </div>

      {/* Main Interactive SVG Map Viewport */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-[580px]">
        {/* SVG Graphic Map */}
        <svg 
          viewBox="0 0 1000 700" 
          className="w-full h-auto select-none"
          style={{ maxHeight: '720px' }}
        >
          <defs>
            {/* Grid background */}
            <pattern id="tacticalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
            </pattern>

            {/* Radar gradient sweep */}
            <linearGradient id="radarBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>

            {/* Hazard Flood Pattern */}
            <pattern id="floodHazardStripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#0284c7" strokeWidth="4" opacity="0.25" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="700" fill="#030712" />
          <rect width="1000" height="700" fill="url(#tacticalGrid)" />

          {/* Coastal Bay Water Contour */}
          <path
            d="M 50 60 Q 250 140 450 120 T 750 90 T 950 60 L 950 10 L 50 10 Z"
            fill="#082f49"
            opacity="0.4"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="350" y="55" fill="#38bdf8" fontSize="11" fontFamily="monospace" opacity="0.7">
            NORTH BAY BASIN (STORM SURGE WATERFRONT)
          </text>

          {/* Simulated Major Road Corridors */}
          <path d="M 120 620 L 380 400 L 720 180" stroke="#334155" strokeWidth="3" fill="none" />
          <path d="M 300 650 L 520 380 L 880 320" stroke="#334155" strokeWidth="2.5" fill="none" />
          <path d="M 80 280 L 850 480" stroke="#1e293b" strokeWidth="2" strokeDasharray="6 4" fill="none" />

          {/* Hazard Zones: Marina Flood Polygon */}
          {showHazards && (
            <g>
              <polygon
                points="220,130 520,110 580,240 310,260"
                fill="url(#floodHazardStripes)"
                stroke="#0ea5e9"
                strokeWidth="1.5"
                opacity="0.9"
              />
              <text x="310" y="180" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                ⚠️ FLOOD SURGE ZONE (SECTOR 4)
              </text>
            </g>
          )}

          {/* Responding Trajectory Lines (from volunteer to incident) */}
          {incidents.filter(i => i.assignedVolunteerId && i.status !== 'RESOLVED').map((inc) => {
            const vol = volunteers.find(v => v.id === inc.assignedVolunteerId);
            if (!vol) return null;
            const ptInc = getCoords(inc.location.lat, inc.location.lng);
            const ptVol = getCoords(vol.location.lat, vol.location.lng);

            return (
              <g key={`traj-${inc.id}`}>
                <line
                  x1={ptVol.x}
                  y1={ptVol.y}
                  x2={ptInc.x}
                  y2={ptInc.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.8"
                >
                  <animate attributeName="stroke-dashoffset" values="24;0" dur="1.2s" repeatCount="indefinite" />
                </line>
                <circle cx={(ptVol.x + ptInc.x) / 2} cy={(ptVol.y + ptInc.y) / 2} r="3" fill="#60a5fa" />
              </g>
            );
          })}

          {/* Shelters Markers */}
          {showShelters && shelters.map((sh) => {
            const pt = getCoords(sh.location.lat, sh.location.lng);
            return (
              <g
                key={sh.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={() => setSelectedEntity({ type: 'SHELTER', data: sh })}
              >
                {/* Outer badge */}
                <rect x="-14" y="-14" width="28" height="28" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <path d="M -6 0 L 6 0 M 0 -6 L 0 6" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                <text x="18" y="4" fill="#a7f3d0" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {sh.name.substring(0, 18)}...
                </text>
              </g>
            );
          })}

          {/* Volunteer Markers */}
          {showVolunteers && volunteers.map((vol) => {
            const pt = getCoords(vol.location.lat, vol.location.lng);
            const isResponding = vol.status === 'RESPONDING';

            return (
              <g
                key={vol.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedEntity({ type: 'VOLUNTEER', data: vol });
                  onSelectVolunteer(vol);
                }}
              >
                {/* Pulsing ring if on active mission */}
                {isResponding && (
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6">
                    <animate attributeName="r" values="10;26" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Main Volunteer Shield */}
                <circle cx="0" cy="0" r="10" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                <text x="0" y="3.5" fill="#ffffff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  {vol.callsign.substring(0, 2)}
                </text>
                <text x="14" y="3" fill="#93c5fd" fontSize="9" fontFamily="monospace">
                  {vol.callsign}
                </text>
              </g>
            );
          })}

          {/* Incident Markers */}
          {showIncidents && incidents.filter(i => i.status !== 'RESOLVED').map((inc) => {
            const pt = getCoords(inc.location.lat, inc.location.lng);
            const isP1 = inc.priority === 'P1_CRITICAL';

            return (
              <g
                key={inc.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedEntity({ type: 'INCIDENT', data: inc });
                  onSelectIncident(inc);
                }}
              >
                {/* Ripple ring for Critical alerts */}
                {isP1 && (
                  <>
                    <circle cx="0" cy="0" r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
                      <animate attributeName="r" values="8;35" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.25)" />
                  </>
                )}

                {/* Core pin */}
                <circle 
                  cx="0" 
                  cy="0" 
                  r="8" 
                  fill={isP1 ? "#dc2626" : inc.priority === 'P2_HIGH' ? "#f59e0b" : "#2563eb"}
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                />

                <text x="12" y="3" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  #{inc.id} ({inc.category.replace('_', ' ')})
                </text>
              </g>
            );
          })}

          {/* Animated Radar Sweep Overlay */}
          {radarSweep && (
            <g transform="translate(500, 350)">
              <circle cx="0" cy="0" r="320" fill="none" stroke="#059669" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" />
              <circle cx="0" cy="0" r="200" fill="none" stroke="#059669" strokeWidth="0.8" opacity="0.25" strokeDasharray="3 3" />
              <circle cx="0" cy="0" r="90" fill="none" stroke="#059669" strokeWidth="0.8" opacity="0.2" strokeDasharray="3 3" />
              <line x1="0" y1="0" x2="320" y2="0" stroke="#10b981" strokeWidth="1.5" opacity="0.7">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          )}
        </svg>

        {/* Floating Quick Entity Inspector Panel */}
        {selectedEntity && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/95 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {selectedEntity.type} TELEMETRY
              </span>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            {selectedEntity.type === 'INCIDENT' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {selectedEntity.data.reporterName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    selectedEntity.data.priority === 'P1_CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {selectedEntity.data.priority}
                  </span>
                </div>
                <p className="text-slate-300">📍 {selectedEntity.data.location.address}</p>
                <p className="text-slate-400 line-clamp-2">"{selectedEntity.data.description}"</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">Assigned: {selectedEntity.data.assignedVolunteerName || 'Unassigned'}</span>
                  <button
                    onClick={() => onSelectIncident(selectedEntity.data)}
                    className="text-blue-400 hover:underline font-bold"
                  >
                    Open Incident →
                  </button>
                </div>
              </div>
            )}

            {selectedEntity.type === 'VOLUNTEER' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {selectedEntity.data.name} ({selectedEntity.data.callsign})
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono text-[10px]">
                    {selectedEntity.data.status}
                  </span>
                </div>
                <p className="text-slate-300">🚗 {selectedEntity.data.vehicleType}</p>
                <p className="text-slate-400">Skills: {selectedEntity.data.skills.join(', ')}</p>
              </div>
            )}

            {selectedEntity.type === 'SHELTER' && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-white text-sm">
                  {selectedEntity.data.name}
                </h4>
                <p className="text-slate-300">📍 {selectedEntity.data.location.address}</p>
                <div className="flex items-center justify-between text-slate-400 pt-1">
                  <span>Occupancy: {selectedEntity.data.occupied} / {selectedEntity.data.capacity}</span>
                  <span className="text-emerald-400 font-bold">{selectedEntity.data.supplies.waterBottles} Water Bottles</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
