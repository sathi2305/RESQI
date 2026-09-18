import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  User, 
  Users, 
  Heart, 
  Clock, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  Flame, 
  Droplets, 
  Layers, 
  Baby, 
  Apple, 
  AlertCircle,
  Eye,
  Flashlight
} from 'lucide-react';
import { Incident, IncidentCategory, IncidentMessage } from '../types.ts';

interface CivilianSOSViewProps {
  activeIncident: Incident | null;
  onSubmitSOS: (data: any) => Promise<void>;
  onCancelSOS: (incidentId: string) => Promise<void>;
  onSendMessage: (incidentId: string, text: string) => Promise<void>;
  messages: IncidentMessage[];
  isSubmitting: boolean;
}

const CATEGORIES: { id: IncidentCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'FLOOD_RESCUE', label: 'Flood / Water Surge', icon: <Droplets className="w-5 h-5 text-cyan-400" />, desc: 'Rising water, trapped on roof/upper floor, boat needed' },
  { id: 'MEDICAL', label: 'Critical Medical', icon: <Heart className="w-5 h-5 text-rose-400" />, desc: 'Severe trauma, arterial bleeding, chest pain, shock' },
  { id: 'TRAPPED', label: 'Trapped / Structural', icon: <Layers className="w-5 h-5 text-amber-400" />, desc: 'Collapsed doorway, rubble, jammed exit, gas odor' },
  { id: 'SPECIAL_CARE', label: 'Oxygen / Infant / Elderly', icon: <Baby className="w-5 h-5 text-purple-400" />, desc: 'Oxygen tank empty, infant formula out, dialysis' },
  { id: 'FIRE_HAZARD', label: 'Fire / Downed Power', icon: <Flame className="w-5 h-5 text-orange-400" />, desc: 'Live electrical cables, smoke inhalation, fire spread' },
  { id: 'FOOD_WATER', label: 'Potable Water & Food', icon: <Apple className="w-5 h-5 text-emerald-400" />, desc: 'Cut off by high water, no drinkable water, rations out' },
];

export const CivilianSOSView: React.FC<CivilianSOSViewProps> = ({
  activeIncident,
  onSubmitSOS,
  onCancelSOS,
  onSendMessage,
  messages,
  isSubmitting,
}) => {
  // Form State
  const [category, setCategory] = useState<IncidentCategory>('FLOOD_RESCUE');
  const [reporterName, setReporterName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState<number>(37.7749);
  const [lng, setLng] = useState<number>(-122.4194);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // People counts
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [injured, setInjured] = useState(1);
  const [pets, setPets] = useState(0);

  // Medical conditions tags
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'Oxygen Dependent / Low Oxygen'
  ]);

  // Chat message input
  const [chatText, setChatText] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [strobeScreen, setStrobeScreen] = useState(false);

  // Auto-detect Geolocation on mount
  useEffect(() => {
    if (!activeIncident && navigator.geolocation) {
      handleGetLocation();
    }
  }, [activeIncident]);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setIsLocating(false);
          if (!address) {
            setAddress(`GPS Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Sector 4)`);
          }
        },
        (err) => {
          console.warn('Geolocation warning, using default disaster sector coords:', err.message);
          setIsLocating(false);
          setGpsAccuracy(12);
          if (!address) {
            setAddress('1420 Marina Boulevard (Sector 4 Waterfront)');
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter(c => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe your emergency so AI Triage can dispatch the correct equipment.');
      return;
    }

    await onSubmitSOS({
      reporterName: reporterName.trim() || 'Citizen in Distress',
      contactNumber: contactNumber.trim() || '+1 (555) 911-HELP',
      category,
      description: description.trim(),
      location: {
        lat,
        lng,
        address: address.trim() || 'Sector 4 Crisis Zone',
        landmark: landmark.trim(),
        accuracy: gpsAccuracy || 10,
      },
      peopleCount: { adults, children, injured, pets },
      medicalConditions: selectedConditions,
    });
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !activeIncident) return;
    await onSendMessage(activeIncident.id, chatText);
    setChatText('');
  };

  // Toggle night rescue strobe screen
  const toggleStrobe = () => {
    setStrobeScreen(!strobeScreen);
  };

  // -------------------------------------------------------------
  // VIEW 1: ACTIVE EMERGENCY INCIDENT BEACON (User has active SOS)
  // -------------------------------------------------------------
  if (activeIncident) {
    const incidentMsgs = messages.filter(m => m.incidentId === activeIncident.id);

    return (
      <div className={`space-y-6 ${strobeScreen ? 'animate-pulse bg-white/10 p-4 rounded-3xl' : ''}`}>
        {/* Night Rescue Strobe Screen Indicator */}
        {strobeScreen && (
          <div className="bg-amber-500 text-black px-4 py-3 rounded-2xl flex items-center justify-between font-bold text-sm shadow-xl">
            <div className="flex items-center gap-2">
              <Flashlight className="w-5 h-5 animate-bounce" />
              <span>NIGHT RESCUE STROBE ACTIVE - Point phone screen upward toward sky or water</span>
            </div>
            <button 
              onClick={() => setStrobeScreen(false)}
              className="bg-black text-white px-3 py-1 rounded-lg text-xs"
            >
              Turn Off Strobe
            </button>
          </div>
        )}

        {/* Top Emergency Status Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  SOS BEACON ACTIVE • #{activeIncident.id}
                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  activeIncident.priority === 'P1_CRITICAL' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' 
                    : activeIncident.priority === 'P2_HIGH'
                    ? 'bg-amber-500 text-black'
                    : 'bg-blue-600 text-white'
                }`}>
                  {activeIncident.priority.replace('_', ' ')}
                </span>

                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                  Status: <strong className="text-white font-mono">{activeIncident.status}</strong>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Help is Coordinated. Responders Alerted.
              </h2>
              <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{activeIncident.location.address} {activeIncident.location.landmark && `(${activeIncident.location.landmark})`}</span>
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleStrobe}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  strobeScreen
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Flashlight className="w-4 h-4" />
                <span>{strobeScreen ? 'Stop Strobe' : 'Night Rescue Strobe'}</span>
              </button>

              <button
                onClick={() => onCancelSOS(activeIncident.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 border border-emerald-800/60 text-xs font-bold transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Am Safe / Resolve</span>
              </button>
            </div>
          </div>

          {/* Rescue Progress Pipeline */}
          <div className="mt-8 pt-6 border-t border-rose-900/40">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
              <div className={`p-3 rounded-xl border ${
                activeIncident.status === 'PENDING' || activeIncident.status === 'DISPATCHED' || activeIncident.status === 'EN_ROUTE' || activeIncident.status === 'ON_SCENE'
                  ? 'bg-rose-950/70 border-rose-700/80 text-rose-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="font-bold">1. SOS TRIAGED</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Priority Assigned</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                activeIncident.status === 'DISPATCHED' || activeIncident.status === 'EN_ROUTE' || activeIncident.status === 'ON_SCENE'
                  ? 'bg-blue-950/70 border-blue-700/80 text-blue-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="font-bold">2. VOLUNTEER ASSIGNED</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{activeIncident.assignedVolunteerName || 'Matching nearest unit...'}</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                activeIncident.status === 'EN_ROUTE' || activeIncident.status === 'ON_SCENE'
                  ? 'bg-amber-950/70 border-amber-700/80 text-amber-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="font-bold">3. EN ROUTE</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ETA: ~{activeIncident.etaMinutes || 5} mins</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                activeIncident.status === 'ON_SCENE'
                  ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="font-bold">4. ON SCENE</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Extraction & Aid</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Assigned Volunteer & AI Survival Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Assigned Responder & Chat (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Assigned Volunteer Card */}
            {activeIncident.assignedVolunteerName ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Assigned Volunteer Responder
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-mono font-bold">
                    ETA: ~{activeIncident.etaMinutes || 4} MINS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                      {activeIncident.assignedVolunteerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {activeIncident.assignedVolunteerName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Vetted ResQ First Responder • Equipped with shallow water boat & medical O2
                      </p>
                    </div>
                  </div>

                  {activeIncident.assignedVolunteerPhone && (
                    <a
                      href={`tel:${activeIncident.assignedVolunteerPhone}`}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Direct Emergency Call</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center">
                <Radio className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
                <h4 className="text-base font-bold text-white mt-3">Connecting Nearest Rescue Volunteer...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  ResQ AI is routing your P1 alert to certified boats, 4x4 units, and paramedics within a 5km radius.
                </p>
              </div>
            )}

            {/* Live Incident Coordination Chat */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Live Coordination Channel
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Encrypted Low-Bandwidth Link</span>
              </div>

              {/* Messages scroll list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {incidentMsgs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Channel active. You can send updates to your assigned volunteer here.
                  </div>
                ) : (
                  incidentMsgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.senderRole === 'VICTIM' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-slate-400">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          msg.senderRole === 'VICTIM'
                            ? 'bg-rose-600 text-white rounded-tr-none'
                            : msg.senderRole === 'SYSTEM'
                            ? 'bg-slate-800/90 text-amber-300 border border-slate-700/80'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                        } ${msg.isUrgent ? 'border-2 border-amber-400 shadow-md' : ''}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Send direct message to responder (e.g. 'Water reached porch')..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatText.trim()}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: AI Triage Guidance & First-Aid Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* AI Immediate Life-Saving Steps */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  AI Immediate Survival Steps
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  CRITICAL DO'S & DONT'S
                </span>
              </div>

              <div className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <strong>ResQ AI Triage Assessment:</strong> {activeIncident.aiTriageSummary}
              </div>

              {/* Actionable Steps Checklist */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Perform while help is en route:
                </p>
                {activeIncident.firstAidInstructions.map((instruction, idx) => {
                  const isDone = completedSteps[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCompletedSteps({ ...completedSteps, [idx]: !isDone })}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isDone 
                          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 line-through opacity-70' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-600'
                      }`}>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="leading-relaxed">{instruction}</span>
                    </div>
                  );
                })}
              </div>

              {/* Identified Hazards Warning */}
              {activeIncident.immediateHazards && activeIncident.immediateHazards.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Identified Active Hazards
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeIncident.immediateHazards.map((hazard, hIdx) => (
                      <span key={hIdx} className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300 text-[11px]">
                        ⚠️ {hazard}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* People & Vulnerabilities Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Cluster On Scene
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Adults</div>
                  <div className="text-base font-bold text-white">{activeIncident.peopleCount.adults}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Children</div>
                  <div className="text-base font-bold text-white">{activeIncident.peopleCount.children}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Injured</div>
                  <div className="text-base font-bold text-rose-400">{activeIncident.peopleCount.injured}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Pets</div>
                  <div className="text-base font-bold text-amber-400">{activeIncident.peopleCount.pets}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: NEW SOS REQUEST FORM (Civilian requesting urgent aid)
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" />
          <span>Emergency Assistance Request</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Request Immediate Emergency Response
        </h1>
        <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
          Your alert will be autonomously analyzed by <strong className="text-rose-400">ResQ AI Triage</strong> to determine threat severity and automatically dispatch the closest vetted volunteer rescue unit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Emergency Category */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-300 font-mono mb-4">
            1. Select Emergency Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30 text-white shadow-lg shadow-rose-950'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {cat.icon}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500 text-white font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{cat.label}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Emergency Description & Voice/Text Detail */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            2. Describe Your Immediate Situation & Danger
          </label>
          <p className="text-xs text-slate-400">
            Be as specific as possible. Mention water height, whether anyone is bleeding or unconscious, or if power lines are down.
          </p>
          <textarea
            id="emergency-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Water surged to 4 feet on ground floor. Trapped on second floor balcony with my elderly mother who is running out of oxygen in portable tank. We need a rescue boat."
            required
            className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
          />

          {/* Quick presets to speed up typing under panic */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-mono">Quick phrases:</span>
            {[
              "Water rising rapidly",
              "Trapped by jammed door",
              "Severe bleeding wound",
              "Oxygen tank empty",
              "Infant needs formula",
              "Downed live power cable"
            ].map((phrase, pIdx) => (
              <button
                type="button"
                key={pIdx}
                onClick={() => setDescription(prev => prev ? `${prev}. ${phrase}` : phrase)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                + {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Location & GPS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              3. Exact Location & Landmark
            </label>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors font-mono"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-rose-400' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Refetch GPS'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Street Address / Approximate Location *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="1420 Marina Boulevard, Sector 4"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Visual Landmark (Crucial for boat/drone spotters)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Yellow house with green roof, yellow towel on balcony railing"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 px-1">
            <span>GPS Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
            <span>Accuracy: ±{gpsAccuracy || 10} meters</span>
          </div>
        </div>

        {/* Step 4: People, Injuries & Medical Conditions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            4. People Present & Vulnerabilities
          </label>

          {/* Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Adults</span>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  -
                </button>
                <span className="text-lg font-bold text-white">{adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults(adults + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Children</span>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  -
                </button>
                <span className="text-lg font-bold text-white">{children}</span>
                <button
                  type="button"
                  onClick={() => setChildren(children + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-rose-400 font-bold block mb-1">Injured Persons</span>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setInjured(Math.max(0, injured - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  -
                </button>
                <span className="text-lg font-bold text-rose-400">{injured}</span>
                <button
                  type="button"
                  onClick={() => setInjured(injured + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Pets / Animals</span>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPets(Math.max(0, pets - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  -
                </button>
                <span className="text-lg font-bold text-white">{pets}</span>
                <button
                  type="button"
                  onClick={() => setPets(pets + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Medical Badges Multi-select */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Medical Conditions / Equipment Needed:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Oxygen Dependent / Low Oxygen",
                "Severe Bleeding / Trauma",
                "Insulin Dependent / Diabetes",
                "Mobility Impaired / Wheelchair",
                "Infant (Needs Formula/Sterile Water)",
                "Hypothermia / Severe Shivering",
                "Asthma / Respiratory Distress",
                "Elderly Non-Ambulatory"
              ].map((cond) => {
                const checked = selectedConditions.includes(cond);
                return (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      checked
                        ? 'bg-rose-950 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '}{cond}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 5: Contact Information */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            5. Contact Information
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Your Name</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Phone Number (For Volunteer Call)</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+1 (555) 234-8901"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Big Tactile Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-submit-sos"
            className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 active:scale-[0.99] disabled:opacity-60 text-white font-extrabold text-lg sm:text-xl tracking-wide shadow-2xl shadow-rose-900/60 transition-all flex items-center justify-center gap-3 ring-4 ring-rose-500/20 cursor-pointer"
          >
            <AlertTriangle className={`w-6 h-6 ${isSubmitting ? 'animate-spin' : 'animate-bounce'}`} />
            <span>{isSubmitting ? 'TRIAGING WITH RESQ AI & DISPATCHING...' : 'TRANSMIT EMERGENCY SOS NOW'}</span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-2 font-mono">
            Autonomous triage will classify priority level and dispatch nearby volunteer units immediately.
          </p>
        </div>
      </form>
    </div>
  );
};
