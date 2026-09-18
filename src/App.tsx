import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { CivilianSOSView } from './components/CivilianSOSView.tsx';
import { VolunteerDashboardView } from './components/VolunteerDashboardView.tsx';
import { LiveRadarMap } from './components/LiveRadarMap.tsx';
import { OpsCommandView } from './components/OpsCommandView.tsx';
import { FirstAidAiModal } from './components/FirstAidAiModal.tsx';
import { DisasterCopilotChatbot } from './components/DisasterCopilotChatbot.tsx';
import { OfflineMeshModal } from './components/OfflineMeshModal.tsx';
import { ShelterEvacuateModal } from './components/ShelterEvacuateModal.tsx';
import { audioBeacon } from './utils/audioBeacon.ts';
import type { Incident, Volunteer, Shelter, IncidentMessage, SituationReport, ChatAction } from './types.ts';
import { CheckCircle2, AlertCircle, Volume2, Bot, Radio } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'civilian' | 'volunteer' | 'ops' | 'map'>('civilian');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [messages, setMessages] = useState<IncidentMessage[]>([]);
  const [myActiveIncidentId, setMyActiveIncidentId] = useState<string | null>(null);
  const [activeVolunteer, setActiveVolunteer] = useState<Volunteer | null>(null);
  const [sitrep, setSitrep] = useState<SituationReport | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGuideOpen, setIsAiGuideOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [evacuateIncident, setEvacuateIncident] = useState<Incident | null>(null);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [incRes, volRes, shRes] = await Promise.all([
        fetch('/api/incidents').then(r => r.json()),
        fetch('/api/volunteers').then(r => r.json()),
        fetch('/api/shelters').then(r => r.json()),
      ]);

      if (incRes.success && incRes.incidents) {
        setIncidents(incRes.incidents);
      }
      if (volRes.success && volRes.volunteers) {
        setVolunteers(volRes.volunteers);
        if (!activeVolunteer && volRes.volunteers.length > 0) {
          setActiveVolunteer(volRes.volunteers[0]);
        }
      }
      if (shRes.success && shRes.shelters) {
        setShelters(shRes.shelters);
      }
    } catch (err) {
      console.warn('Data sync warning:', err);
    }
  };

  // Fetch active messages for the current incident
  const activeIncident = incidents.find(i => i.id === myActiveIncidentId) || null;

  useEffect(() => {
    if (activeIncident) {
      fetchMessages(activeIncident.id);
      const msgTimer = setInterval(() => fetchMessages(activeIncident.id), 5000);
      return () => clearInterval(msgTimer);
    }
  }, [activeIncident?.id]);

  const fetchMessages = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/messages`).then(r => r.json());
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (e) {
      console.warn('Failed to fetch messages:', e);
    }
  };

  // 1. Submit New SOS from Civilian
  const handleSubmitSOS = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents(prev => [data.incident, ...prev]);
        setMyActiveIncidentId(data.incident.id);
        showToast(`🚨 SOS Broadcasted! Priority: ${data.incident.priority}. AI Triage complete.`);
        audioBeacon.playSinglePulse(880, 400);
        // refresh volunteers state
        fetchData();
      } else {
        alert(data.error || 'Failed to submit SOS');
      }
    } catch (err: any) {
      alert('Network error submitting SOS. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Cancel or Resolve SOS
  const handleCancelSOS = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', notes: 'Civilian confirmed safe and resolved.' }),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents(prev => prev.map(i => i.id === incidentId ? data.incident : i));
        setMyActiveIncidentId(null);
        showToast('Incident marked Resolved. We are glad you are safe!');
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  // 3. Claim Incident (Volunteer)
  const handleClaimIncident = async (incidentId: string, volunteerId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISPATCHED', volunteerId }),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents(prev => prev.map(i => i.id === incidentId ? data.incident : i));
        showToast(`Mission Claimed! Navigation route established for #${incidentId}`);
        fetchData();
      }
    } catch (e) {
      alert('Error claiming incident');
    }
  };

  // 4. Update Status (Volunteer en-route, on-scene, resolved)
  const handleUpdateStatus = async (incidentId: string, status: any, notes?: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, volunteerId: activeVolunteer?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents(prev => prev.map(i => i.id === incidentId ? data.incident : i));
        showToast(`Status updated to ${status}`);
        fetchData();
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  // 5. Send Coordination Chat Message
  const handleSendMessage = async (incidentId: string, text: string) => {
    try {
      const senderRole = currentTab === 'civilian' ? 'VICTIM' : 'VOLUNTEER';
      const senderName = currentTab === 'civilian' 
        ? (activeIncident?.reporterName || 'Citizen')
        : (activeVolunteer ? `${activeVolunteer.name} (${activeVolunteer.callsign})` : 'Responder');
      const senderId = currentTab === 'civilian' ? 'VICTIM' : (activeVolunteer?.id || 'VOL');

      const res = await fetch(`/api/incidents/${incidentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          senderId,
          senderName,
          senderRole,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (e) {
      console.warn('Error sending message:', e);
    }
  };

  // 6. Generate AI SitRep (Ops Center)
  const handleGenerateSitRep = async (): Promise<SituationReport | null> => {
    try {
      const res = await fetch('/api/ai/sitrep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.sitrep) {
        setSitrep(data.sitrep);
        showToast('Real-time Situation Report synthesized by Gemini 3.8 Flash');
        return data.sitrep;
      }
    } catch (e) {
      console.warn('SitRep error:', e);
    }
    return null;
  };

  // 7. Ask AI Emergency Medic (Gemini)
  const handleAskAiMedic = async (question: string): Promise<string> => {
    const res = await fetch('/api/ai/firstaid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, incidentContext: activeIncident }),
    });
    const data = await res.json();
    if (data.success && data.answer) {
      return data.answer;
    }
    return 'Immediate guidance: ensure scene safety, control bleeding with direct pressure, keep warm with blankets.';
  };

  // 8. Register new volunteer
  const handleRegisterVolunteer = async (volData: any) => {
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volData),
      });
      const data = await res.json();
      if (data.success && data.volunteer) {
        setVolunteers(prev => [...prev, data.volunteer]);
        setActiveVolunteer(data.volunteer);
        showToast(`Welcome ${data.volunteer.name}! Added to verified dispatch fleet.`);
      }
    } catch (e) {
      alert('Error registering responder');
    }
  };

  // Toggle Siren / Audio Beacon
  const handleToggleSiren = () => {
    if (isSirenActive) {
      audioBeacon.stopEmergencySiren();
      setIsSirenActive(false);
      showToast('Audio Beacon Stopped.');
    } else {
      audioBeacon.startEmergencySiren();
      setIsSirenActive(true);
      showToast('Emergency Audio Beacon & SAR ping ACTIVE.');
    }
  };

  // 9. Ingest Low-Bandwidth / Mesh Radio Packet
  const handleIngestMeshPacket = async (packet: string) => {
    try {
      const res = await fetch('/api/incidents/mesh-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packet }),
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents(prev => [data.incident, ...prev]);
        showToast(`Decoded radio packet: ${data.incident.id} injected into live radar!`);
        fetchData();
      } else {
        throw new Error(data.error || 'Failed to decode packet');
      }
    } catch (err: any) {
      alert(err.message || 'Error ingesting packet');
      throw err;
    }
  };

  // 10. Evacuate Incident Victims to Shelter
  const handleEvacuateToShelter = async (shelterId: string, incidentId: string, count: number) => {
    try {
      const res = await fetch(`/api/shelters/${shelterId}/evacuate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, peopleCount: count }),
      });
      const data = await res.json();
      if (data.success && data.shelter) {
        setShelters(prev => prev.map(s => s.id === shelterId ? data.shelter : s));
        showToast(`Safe Transfer: ${count} evacuees checked in at ${data.shelter.name}`);
        fetchData();
      }
    } catch (err) {
      alert('Error routing evacuees to shelter.');
      throw err;
    }
  };

  // 11. Handle Project-Oriented Chatbot Action Clicks
  const handleExecuteChatAction = (action: ChatAction) => {
    switch (action.actionType) {
      case 'NAVIGATE_TAB':
        if (action.payload?.tab) {
          setCurrentTab(action.payload.tab);
          showToast(`Switched to ${action.payload.tab.toUpperCase()} view`);
        }
        break;
      case 'VIEW_INCIDENT':
        setCurrentTab('volunteer');
        showToast(`Focusing incident ${action.payload?.id || ''}`);
        break;
      case 'VIEW_SHELTER':
        setCurrentTab('ops');
        showToast(`Relief Hub details opened in Ops Command`);
        break;
      case 'PREFILL_SOS':
        setCurrentTab('civilian');
        showToast('SOS Beacon Ready for submission');
        break;
      case 'TOGGLE_SIREN':
        handleToggleSiren();
        break;
      case 'CLAIM_INCIDENT':
        if (action.payload?.id && activeVolunteer) {
          handleClaimIncident(action.payload.id, activeVolunteer.id);
        }
        break;
      default:
        break;
    }
  };

  const criticalIncidentsCount = incidents.filter(i => i.priority === 'P1_CRITICAL' && i.status !== 'RESOLVED').length;
  const activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const availableVolunteersCount = volunteers.filter(v => v.status === 'AVAILABLE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-mono animate-fade-in max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeIncidentsCount={activeIncidentsCount}
        criticalIncidentsCount={criticalIncidentsCount}
        availableVolunteersCount={availableVolunteersCount}
        onOpenAiGuide={() => setIsAiGuideOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenMeshModal={() => setIsMeshModalOpen(true)}
        isSirenActive={isSirenActive}
        onToggleSiren={handleToggleSiren}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'civilian' && (
          <CivilianSOSView
            activeIncident={activeIncident}
            onSubmitSOS={handleSubmitSOS}
            onCancelSOS={handleCancelSOS}
            onSendMessage={handleSendMessage}
            messages={messages}
            isSubmitting={isSubmitting}
          />
        )}

        {currentTab === 'volunteer' && activeVolunteer && (
          <VolunteerDashboardView
            volunteers={volunteers}
            activeVolunteer={activeVolunteer}
            setActiveVolunteer={setActiveVolunteer}
            incidents={incidents}
            shelters={shelters}
            onClaimIncident={handleClaimIncident}
            onUpdateStatus={handleUpdateStatus}
            onSendMessage={handleSendMessage}
            onRegisterVolunteer={handleRegisterVolunteer}
            onOpenEvacuateModal={(inc) => setEvacuateIncident(inc)}
          />
        )}

        {currentTab === 'map' && (
          <LiveRadarMap
            incidents={incidents}
            volunteers={volunteers}
            shelters={shelters}
            onSelectIncident={(inc) => {
              setCurrentTab('volunteer');
            }}
            onSelectVolunteer={(vol) => {
              setActiveVolunteer(vol);
              setCurrentTab('volunteer');
            }}
          />
        )}

        {currentTab === 'ops' && (
          <OpsCommandView
            incidents={incidents}
            volunteers={volunteers}
            shelters={shelters}
            onGenerateSitRep={handleGenerateSitRep}
            initialSitRep={sitrep}
          />
        )}
      </main>

      {/* Floating ResQ Copilot Chatbot FAB (if closed) */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-5 right-5 z-40 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white shadow-2xl shadow-rose-950 hover:shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3 cursor-pointer ring-2 ring-rose-400/40 group"
          title="Open ResQ AI Disaster Copilot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block font-mono">
            <div className="text-xs font-bold leading-tight">RESQ COPILOT</div>
            <div className="text-[10px] text-rose-200">Disaster AI Chatbot</div>
          </div>
        </button>
      )}

      {/* ResQ Disaster Copilot Chatbot */}
      <DisasterCopilotChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onExecuteAction={handleExecuteChatAction}
        incidents={incidents}
        volunteers={volunteers}
        shelters={shelters}
        activeIncidentId={myActiveIncidentId}
        activeVolunteerId={activeVolunteer?.id}
      />

      {/* Offline Satellite & Radio Mesh Transceiver Modal */}
      <OfflineMeshModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        incidents={incidents}
        onIngestPacket={handleIngestMeshPacket}
      />

      {/* Shelter Evacuation Modal */}
      <ShelterEvacuateModal
        isOpen={!!evacuateIncident}
        onClose={() => setEvacuateIncident(null)}
        incident={evacuateIncident}
        shelters={shelters}
        onEvacuate={handleEvacuateToShelter}
      />

      {/* AI First Aid Modal */}
      <FirstAidAiModal
        isOpen={isAiGuideOpen}
        onClose={() => setIsAiGuideOpen(false)}
        onAskAi={handleAskAiMedic}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ResQ AI • Community Disaster Response & Volunteer Dispatch</span>
          <span>FEMA Incident Command System (ICS) Compatible • Powered by Gemini 3.8 Flash</span>
        </div>
      </footer>
    </div>
  );
}
