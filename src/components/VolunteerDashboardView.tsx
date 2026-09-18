import React, { useState } from 'react';
import { 
  Shield, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Navigation, 
  Wrench, 
  Award, 
  UserCheck, 
  Send, 
  Car, 
  Compass, 
  Radio, 
  Filter, 
  Users, 
  Heart, 
  Layers, 
  Droplets, 
  CheckSquare, 
  Square,
  Sparkles,
  Search,
  Home,
  Target
} from 'lucide-react';
import { Incident, Volunteer, PriorityLevel, IncidentCategory, Shelter } from '../types.ts';

interface VolunteerDashboardViewProps {
  volunteers: Volunteer[];
  activeVolunteer: Volunteer;
  setActiveVolunteer: (vol: Volunteer) => void;
  incidents: Incident[];
  shelters?: Shelter[];
  onClaimIncident: (incidentId: string, volunteerId: string) => Promise<void>;
  onUpdateStatus: (incidentId: string, status: any, notes?: string) => Promise<void>;
  onSendMessage: (incidentId: string, text: string) => Promise<void>;
  onRegisterVolunteer: (data: any) => Promise<void>;
  onOpenEvacuateModal?: (incident: Incident) => void;
}

export const VolunteerDashboardView: React.FC<VolunteerDashboardViewProps> = ({
  volunteers,
  activeVolunteer,
  setActiveVolunteer,
  incidents,
  shelters = [],
  onClaimIncident,
  onUpdateStatus,
  onSendMessage,
  onRegisterVolunteer,
  onOpenEvacuateModal,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<Incident | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // New volunteer form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSkills, setNewSkills] = useState('Swift Water Rescue, CPR');
  const [newVehicle, setNewVehicle] = useState('4x4 SUV');

  // Mission checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Active mission for the current volunteer (if any)
  const activeMission = incidents.find(
    i => i.assignedVolunteerId === activeVolunteer.id && i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
  );

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${inc.description} ${inc.location.address} ${inc.category} ${inc.aiTriageSummary}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await onRegisterVolunteer({
      name: newName.trim(),
      role: newRole.trim() || 'Community First Responder',
      callsign: `Unit-${Math.floor(100 + Math.random() * 900)}`,
      phone: newPhone.trim() || '+1 (555) 430-8811',
      skills: newSkills.split(',').map(s => s.trim()),
      vehicleType: newVehicle,
    });
    setShowRegisterModal(false);
  };

  // Distance calculator helper
  const getDistanceKm = (inc: Incident) => {
    const R = 6371;
    const dLat = (inc.location.lat - activeVolunteer.location.lat) * (Math.PI / 180);
    const dLon = (inc.location.lng - activeVolunteer.location.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(activeVolunteer.location.lat * (Math.PI / 180)) * Math.cos(inc.location.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // AI Volunteer Compatibility Match Calculator
  const getMatchAnalysis = (inc: Incident) => {
    let score = 52;
    const reasons: string[] = [];
    const distNum = parseFloat(getDistanceKm(inc));

    if (distNum < 2.0) {
      score += 24;
      reasons.push(`<2km proximity`);
    } else if (distNum < 5.0) {
      score += 14;
      reasons.push(`<5km zone`);
    } else {
      score += 5;
    }

    const matchedEquip = activeVolunteer.equipment.filter(ve => 
      inc.equipmentNeeded.some(ie => ie.toLowerCase().includes(ve.toLowerCase()) || ve.toLowerCase().includes(ie.toLowerCase()))
    );
    if (matchedEquip.length > 0) {
      score += Math.min(22, matchedEquip.length * 11);
      reasons.push(matchedEquip[0]);
    }

    const matchedSkills = activeVolunteer.skills.filter(vs =>
      inc.recommendedSkills.some(rs => rs.toLowerCase().includes(vs.toLowerCase()) || vs.toLowerCase().includes(rs.toLowerCase()))
    );
    if (matchedSkills.length > 0) {
      score += Math.min(22, matchedSkills.length * 11);
      reasons.push(matchedSkills[0]);
    }

    const finalScore = Math.min(98, Math.max(50, score));
    return { score: finalScore, reasons };
  };

  return (
    <div className="space-y-6">
      {/* Volunteer Identity & Status Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Volunteer Selector & Profile */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-2 ring-blue-500/30 shrink-0">
              {activeVolunteer.name.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-sans">
                  {activeVolunteer.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                  {activeVolunteer.callsign}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {activeVolunteer.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>{activeVolunteer.role}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  {activeVolunteer.vehicleType}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-mono">
                  ★ {activeVolunteer.rating.toFixed(2)} ({activeVolunteer.completedMissions} missions completed)
                </span>
              </p>

              {/* Skills Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {activeVolunteer.skills.map((skill, sIdx) => (
                  <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Switch Active Volunteer / Register */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Select Unit:</span>
              <select
                value={activeVolunteer.id}
                onChange={(e) => {
                  const selected = volunteers.find(v => v.id === e.target.value);
                  if (selected) setActiveVolunteer(selected);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                {volunteers.map((vol) => (
                  <option key={vol.id} value={vol.id}>
                    {vol.name} ({vol.callsign}) - {vol.status}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              + Register Responder
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE MISSION CARD (If Current Volunteer Has an Active Incident) */}
      {activeMission && (
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-2 border-blue-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-900/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 font-mono text-xs font-bold animate-pulse">
                  ACTIVE DEPLOYED MISSION
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono text-xs font-bold">
                  {activeMission.priority.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  #{activeMission.id}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {activeMission.reporterName} • {activeMission.location.address}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Landmark: {activeMission.location.landmark || 'None specified'}</span>
                <span>•</span>
                <span className="text-blue-300 font-bold font-mono">Distance: ~{getDistanceKm(activeMission)} km</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${activeMission.contactNumber}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Victim</span>
              </a>

              {onOpenEvacuateModal && (
                <button
                  onClick={() => onOpenEvacuateModal(activeMission)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-600 text-emerald-200 font-bold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>Route to Shelter</span>
                </button>
              )}

              {activeMission.status !== 'ON_SCENE' ? (
                <button
                  onClick={() => onUpdateStatus(activeMission.id, 'ON_SCENE', 'Volunteer arrived on scene and assessing.')}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Mark "On Scene"</span>
                </button>
              ) : (
                <button
                  onClick={() => onUpdateStatus(activeMission.id, 'RESOLVED', 'All victims safely evacuated / triaged.')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete & Mark Resolved</span>
                </button>
              )}
            </div>
          </div>

          {/* Mission Details & Tactical Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Triage & Situation */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-400 uppercase font-mono block">
                  Incident Description:
                </span>
                <p className="text-slate-200 leading-relaxed text-sm">
                  "{activeMission.description}"
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Hazards & Equipment Check:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeMission.equipmentNeeded.map((eq, eIdx) => (
                    <span key={eIdx} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">
                      📦 {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Step-by-Step ICS Tactical Checklist */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-blue-400 uppercase font-mono block">
                FEMA / ICS Standard Operating Checklist:
              </span>
              {[
                { id: 'step-1', text: 'Confirm dispatch & departure with Incident Commander' },
                { id: 'step-2', text: 'Maintain VHF/radio contact & announce en route status' },
                { id: 'step-3', text: 'Dynamic 360° scene safety inspection (power/water surge)' },
                { id: 'step-4', text: 'Establish voice and visual contact with trapped residents' },
                { id: 'step-5', text: 'Administer emergency trauma/hypothermia stabilization' },
                { id: 'step-6', text: 'Extract cluster & transport to Civic Center evacuation hub' },
              ].map((step) => {
                const checked = checklist[`${activeMission.id}-${step.id}`];
                return (
                  <div
                    key={step.id}
                    onClick={() => toggleChecklistItem(`${activeMission.id}-${step.id}`)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? 'bg-blue-950/40 border-blue-800 text-blue-300 line-through opacity-70'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span>{step.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Incident Dispatch Board */}
      <div className="space-y-4">
        {/* Controls and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address, description, or triage keywords..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
            >
              <option value="ALL">All Priorities</option>
              <option value="P1_CRITICAL">P1 Critical Only</option>
              <option value="P2_HIGH">P2 High Only</option>
              <option value="P3_MODERATE">P3 Moderate Only</option>
              <option value="P4_LOW">P4 Low Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="FLOOD_RESCUE">Flood & Water</option>
              <option value="MEDICAL">Critical Medical</option>
              <option value="TRAPPED">Trapped & USAR</option>
              <option value="FOOD_WATER">Food & Water</option>
              <option value="SPECIAL_CARE">Oxygen & Vulnerable</option>
            </select>
          </div>
        </div>

        {/* Incidents Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIncidents.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 text-sm">
              No matching emergency incidents found for the selected filters.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isP1 = inc.priority === 'P1_CRITICAL';
              const isClaimedByMe = inc.assignedVolunteerId === activeVolunteer.id;
              const isResolved = inc.status === 'RESOLVED';
              const distanceKm = getDistanceKm(inc);
              const match = getMatchAnalysis(inc);

              return (
                <div
                  key={inc.id}
                  className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                    isP1
                      ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-900/60 hover:border-rose-500 shadow-lg shadow-rose-950/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  } ${isResolved ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-4">
                    {/* Header: Priority, Distance, ID */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono tracking-wider ${
                            isP1
                              ? 'bg-red-600 text-white shadow-md shadow-red-900'
                              : inc.priority === 'P2_HIGH'
                              ? 'bg-amber-500 text-black'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {inc.priority.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-400">#{inc.id}</span>
                      </div>

                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        📍 ~{distanceKm} km away
                      </span>
                    </div>

                    {/* AI Volunteer Compatibility Score Banner */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{match.score}% Compatibility Match</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {match.reasons.slice(0, 2).join(' • ')}
                      </span>
                    </div>

                    {/* Location & Title */}
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        {inc.reporterName}
                        <span className="text-xs font-normal text-slate-400">({inc.category.replace('_', ' ')})</span>
                      </h4>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{inc.location.address}</span>
                      </p>
                    </div>

                    {/* AI Triage Brief */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-400 uppercase mb-1">
                        <Sparkles className="w-3 h-3" />
                        AI Triage Brief
                      </div>
                      {inc.aiTriageSummary}
                    </div>

                    {/* Vulnerable cluster & requirements */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-3">
                        <span>👥 {inc.peopleCount.adults + inc.peopleCount.children} people</span>
                        {inc.peopleCount.injured > 0 && (
                          <span className="text-rose-400 font-bold">🩹 {inc.peopleCount.injured} injured</span>
                        )}
                        {inc.peopleCount.pets > 0 && (
                          <span>🐾 {inc.peopleCount.pets} pets</span>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-slate-400">
                        Status: <strong className="text-white">{inc.status}</strong>
                      </span>
                    </div>

                    {/* Skills match */}
                    <div className="flex flex-wrap gap-1">
                      {inc.recommendedSkills.map((sk, skIdx) => {
                        const hasSkill = activeVolunteer.skills.some(vsk => vsk.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(vsk.toLowerCase()));
                        return (
                          <span
                            key={skIdx}
                            className={`text-[10px] px-2 py-0.5 rounded-md border ${
                              hasSkill 
                                ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            {hasSkill ? '✓ ' : ''}{sk}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedIncidentModal(inc)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      View Details
                    </button>

                    {isResolved ? (
                      <span className="text-xs font-mono text-emerald-400 font-bold">✓ Mission Completed</span>
                    ) : isClaimedByMe ? (
                      <span className="px-4 py-2 rounded-xl bg-blue-950 border border-blue-700 text-blue-300 text-xs font-bold font-mono">
                        You Are Responding
                      </span>
                    ) : inc.assignedVolunteerName ? (
                      <span className="text-xs font-mono text-slate-500">
                        Claimed by {inc.assignedVolunteerName}
                      </span>
                    ) : (
                      <button
                        onClick={() => onClaimIncident(inc.id, activeVolunteer.id)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950 transition-colors flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Accept & Respond</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono text-xs font-bold">
                  {selectedIncidentModal.priority.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-slate-400">#{selectedIncidentModal.id}</span>
              </div>
              <button
                onClick={() => setSelectedIncidentModal(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                {selectedIncidentModal.reporterName} • {selectedIncidentModal.category.replace('_', ' ')}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{selectedIncidentModal.location.address}</span>
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
              <strong className="text-slate-400 block mb-1">Full Description:</strong>
              "{selectedIncidentModal.description}"
            </div>

            {/* AI Survival Steps */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Instructions Provided to Victim:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selectedIncidentModal.firstAidInstructions.map((f, fIdx) => (
                  <li key={fIdx}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Required Equipment */}
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono mb-2">
                Required Rescue Equipment:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedIncidentModal.equipmentNeeded.map((eq, eqIdx) => (
                  <span key={eqIdx} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs">
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedIncidentModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              {selectedIncidentModal.status !== 'RESOLVED' && !selectedIncidentModal.assignedVolunteerId && (
                <button
                  onClick={() => {
                    onClaimIncident(selectedIncidentModal.id, activeVolunteer.id);
                    setSelectedIncidentModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Accept & Respond to this SOS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleRegisterSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Register As New Disaster Responder
            </h3>
            <p className="text-xs text-slate-400">
              Join the vetted ResQ emergency dispatch roster.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Specialty / Role</label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g. Wilderness First Responder / Drone Pilot"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 302-9901"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Vehicle Type</label>
              <input
                type="text"
                value={newVehicle}
                onChange={(e) => setNewVehicle(e.target.value)}
                placeholder="e.g. 4x4 Jeep with Winch, Kayak, Truck"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Skills & Certifications (comma separated)</label>
              <input
                type="text"
                value={newSkills}
                onChange={(e) => setNewSkills(e.target.value)}
                placeholder="CPR, Swift Water, EMT, Heavy Lifting"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Join Response Network
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
