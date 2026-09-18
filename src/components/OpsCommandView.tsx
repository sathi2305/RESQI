import React, { useState } from 'react';
import { 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  Shield, 
  Users, 
  Home, 
  Radio, 
  Send, 
  CheckCircle, 
  Clock, 
  FileText, 
  Copy, 
  TrendingUp, 
  Droplet, 
  Zap, 
  Box 
} from 'lucide-react';
import { Incident, Volunteer, Shelter, SituationReport } from '../types.ts';

interface OpsCommandViewProps {
  incidents: Incident[];
  volunteers: Volunteer[];
  shelters: Shelter[];
  onGenerateSitRep: () => Promise<SituationReport | null>;
  initialSitRep: SituationReport | null;
}

export const OpsCommandView: React.FC<OpsCommandViewProps> = ({
  incidents,
  volunteers,
  shelters,
  onGenerateSitRep,
  initialSitRep,
}) => {
  const [sitrep, setSitrep] = useState<SituationReport | null>(initialSitRep);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const p1Incidents = activeIncidents.filter(i => i.priority === 'P1_CRITICAL');
  const availableVolunteers = volunteers.filter(v => v.status === 'AVAILABLE');
  const respondingVolunteers = volunteers.filter(v => v.status === 'RESPONDING' || v.status === 'ON_SCENE');

  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = shelters.reduce((acc, s) => acc + s.occupied, 0);
  const occupancyPercent = Math.round((totalOccupied / (totalCapacity || 1)) * 100);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const rep = await onGenerateSitRep();
    if (rep) {
      setSitrep(rep);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    if (!sitrep) return;
    const text = `=== FEMA ICS-201 INCIDENT BRIEFING (RESQ AI) ===
Threat Level: ${sitrep.overallThreatLevel}
Timestamp: ${sitrep.timestamp}

EXECUTIVE SUMMARY:
${sitrep.summary}

CRITICAL SECTORS:
${sitrep.criticalSectors.map(s => `- ${s.name}: ${s.incidentCount} active calls (${s.riskFactor})`).join('\n')}

BOTTLENECK ALERTS:
${sitrep.keyBottlenecks.map(b => `- ${b}`).join('\n')}

RECOMMENDED ACTIONS:
${sitrep.recommendations.map(r => `* ${r}`).join('\n')}
=============================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastText('');
    }, 3500);
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Disaster Ops Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>INCIDENT COMMAND SYSTEM (ICS-201)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Metropolitan Disaster Coordination Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-agency volunteer dispatch, shelter logistics, and AI threat assessment.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          id="btn-generate-sitrep"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-950 transition-all cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'ANALYZING TELEMETRY (GEMINI)...' : 'GENERATE REAL-TIME SITREP'}</span>
        </button>
      </div>

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Incidents */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ACTIVE INCIDENTS</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-white font-sans">
            {activeIncidents.length}
          </div>
          <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1 font-bold">
            <span>{p1Incidents.length} P1 Critical (Life Threat)</span>
          </div>
        </div>

        {/* Metric 2: Volunteer Responders */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>DEPLOYED UNITS</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-sans">
            {respondingVolunteers.length} <span className="text-sm font-normal text-slate-400">/ {volunteers.length}</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 font-bold">
            {availableVolunteers.length} Units Staged in Reserve
          </div>
        </div>

        {/* Metric 3: Evacuees Sheltered */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SHELTER OCCUPANCY</span>
            <Home className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-sans">
            {occupancyPercent}%
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {totalOccupied} / {totalCapacity} beds filled
          </div>
        </div>

        {/* Metric 4: Triage Response Time */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>AVG DISPATCH SPEED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-sans">
            4.2 <span className="text-sm font-normal text-slate-400">mins</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            AI automated classification
          </div>
        </div>
      </div>

      {/* AI SITREP (Situation Report) BRIEFING */}
      {sitrep && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  RESQ AI SITUATION REPORT (ICS-201)
                  <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    sitrep.overallThreatLevel === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {sitrep.overallThreatLevel} THREAT
                  </span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Generated: {new Date(sitrep.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy ICS-201 Brief'}</span>
            </button>
          </div>

          {/* Summary */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-slate-200 text-sm leading-relaxed">
            <strong className="text-amber-400 block mb-1 font-mono text-xs uppercase tracking-wider">
              Executive Briefing:
            </strong>
            {sitrep.summary}
          </div>

          {/* 3 Columns: Critical Sectors, Bottlenecks, Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Critical Sectors */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Critical Sectors:
              </h4>
              <div className="space-y-2">
                {sitrep.criticalSectors.map((sec, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{sec.name}</span>
                      <span className="text-rose-400 font-mono">{sec.incidentCount} Calls</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{sec.riskFactor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Bottlenecks */}
            <div className="space-y-2">
              <h4 className="font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                Key Supply & Access Bottlenecks:
              </h4>
              <div className="space-y-2">
                {sitrep.keyBottlenecks.map((bot, bIdx) => (
                  <div key={bIdx} className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-200 text-[11px]">
                    ⚠️ {bot}
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Directives */}
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Commander Action Directives:
              </h4>
              <div className="space-y-2">
                {sitrep.recommendations.map((rec, rIdx) => (
                  <div key={rIdx} className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-[11px]">
                    ✓ {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relief Shelters & Supply Matrix */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <Home className="w-5 h-5 text-emerald-400" />
          ACTIVE EMERGENCY RELIEF HUBS & SUPPLY DEPOTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shelters.map((sh) => {
            const pct = Math.round((sh.occupied / sh.capacity) * 100);
            return (
              <div key={sh.id} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-900">
                      {sh.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {sh.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-2">{sh.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{sh.location.address}</p>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Occupancy</span>
                    <span className="font-bold text-white">{sh.occupied} / {sh.capacity} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Supplies Inventory */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{sh.supplies.waterBottles} Water</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    <span>{sh.supplies.mrePacks} MREs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{sh.supplies.powerGenerators} GenSets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{sh.medicalStaffPresent ? 'Med Staff ON' : 'No Med Staff'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector Emergency Broadcast Module */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-400" />
          Broadcast Emergency Advisory to Sector Units
        </h3>
        <p className="text-xs text-slate-400">
          Transmits high-priority alert notification across all registered mobile devices and VHF relays in Sector 4.
        </p>

        <form onSubmit={handleBroadcast} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="e.g. ADVISORY: High tide surge at 18:00 hrs. All boat units retreat to staging point Alpha..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!broadcastText.trim() || broadcastSent}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>{broadcastSent ? 'BROADCAST SENT!' : 'SEND PRIORITY ALERT'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
