import React from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  HeartHandshake, 
  Bot, 
  Radio,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';
import { PriorityLevel } from '../types.ts';

interface HeaderProps {
  currentTab: 'civilian' | 'volunteer' | 'ops' | 'map';
  setCurrentTab: (tab: 'civilian' | 'volunteer' | 'ops' | 'map') => void;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  availableVolunteersCount: number;
  onOpenAiGuide: () => void;
  onOpenChatbot: () => void;
  onOpenMeshModal: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeIncidentsCount,
  criticalIncidentsCount,
  availableVolunteersCount,
  onOpenAiGuide,
  onOpenChatbot,
  onOpenMeshModal,
  isSirenActive,
  onToggleSiren,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Top Disaster Status Ribbon */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950/60 border-b border-rose-900/40 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-bold text-rose-300 tracking-wide uppercase">METRO CRISIS RESPONSE ACTIVE</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">Severe Storm Surge & Flash Floods (Sector 4 - Marina / Bay)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 font-bold">{criticalIncidentsCount}</span>
              <span className="text-slate-400">P1 Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">{activeIncidentsCount}</span>
              <span className="text-slate-400">Total Calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">{availableVolunteersCount}</span>
              <span className="text-slate-400">Responders Staged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('civilian')}>
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-rose-900/30 ring-1 ring-rose-500/30">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  ResQ<span className="text-rose-500">AI</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  DISASTER OPS v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous AI Triage & Volunteer Coordination Platform
              </p>
            </div>
          </div>

          {/* Quick Siren Mobile Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenChatbot}
              className="p-2 rounded-lg bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs font-mono flex items-center gap-1"
              title="ResQ Disaster Copilot AI"
            >
              <Bot className="w-4 h-4 text-rose-400" />
            </button>
            <button
              onClick={onOpenMeshModal}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1"
              title="Mesh Radio"
            >
              <Radio className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={onToggleSiren}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                isSirenActive 
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title="Acoustic Beacon"
            >
              {isSirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 w-full md:w-auto overflow-x-auto">
          <button
            id="tab-civilian-sos"
            onClick={() => setCurrentTab('civilian')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
              currentTab === 'civilian'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>I Need Help (SOS)</span>
          </button>

          <button
            id="tab-volunteer-responder"
            onClick={() => setCurrentTab('volunteer')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
              currentTab === 'volunteer'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Volunteer Responder</span>
          </button>

          <button
            id="tab-live-radar"
            onClick={() => setCurrentTab('map')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
              currentTab === 'map'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-teal-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Live Radar & Map</span>
          </button>

          <button
            id="tab-ops-command"
            onClick={() => setCurrentTab('ops')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
              currentTab === 'ops'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ops Command (ICS)</span>
          </button>
        </nav>

        {/* Global Utilities */}
        <div className="hidden md:flex items-center gap-2">
          {/* Disaster Copilot Chatbot Button */}
          <button
            id="btn-disaster-copilot"
            onClick={onOpenChatbot}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-950 to-slate-900 border border-rose-500/40 hover:border-rose-400 text-rose-200 hover:text-white text-xs font-bold transition-all shadow-md shadow-rose-950 group cursor-pointer"
          >
            <div className="relative">
              <Bot className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <span>Disaster Copilot</span>
          </button>

          {/* Satellite & Radio Mesh Transceiver */}
          <button
            id="btn-mesh-radio"
            onClick={onOpenMeshModal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-medium transition-all group shadow-sm cursor-pointer"
            title="Satellite & Low-Bandwidth Packet Mesh"
          >
            <Radio className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Radio / Mesh</span>
          </button>

          <button
            id="btn-ai-firstaid"
            onClick={onOpenAiGuide}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 text-xs font-medium transition-all group shadow-sm cursor-pointer"
          >
            <Bot className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Medic Guide</span>
          </button>

          <button
            id="btn-acoustic-beacon"
            onClick={onToggleSiren}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isSirenActive
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-900/50 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-300 hover:border-rose-900/60'
            }`}
            title="Acoustic Emergency Locator Beacon (for night SAR)"
          >
            {isSirenActive ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span className="font-bold">SIREN ON</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>Beacon</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
