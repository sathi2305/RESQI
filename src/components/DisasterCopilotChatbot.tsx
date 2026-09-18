import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Shield, 
  Compass, 
  AlertTriangle, 
  Home, 
  Radio, 
  HelpCircle, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  User,
  Trash2
} from 'lucide-react';
import type { ProjectChatMessage, ChatAction, Incident, Volunteer, Shelter } from '../types.ts';

interface DisasterCopilotChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (action: ChatAction) => void;
  incidents: Incident[];
  volunteers: Volunteer[];
  shelters: Shelter[];
  activeIncidentId?: string | null;
  activeVolunteerId?: string | null;
}

const DEFAULT_PROMPTS = [
  "🚨 Which P1 incidents need immediate rescue?",
  "🏥 Find open shelters with medical staff",
  "🚤 Which responder has a rescue boat?",
  "⚡ What are our backup generator reserves?",
  "🩹 Immediate steps to treat arterial bleeding",
  "📋 Give me an executive Sector 4 brief"
];

export const DisasterCopilotChatbot: React.FC<DisasterCopilotChatbotProps> = ({
  isOpen,
  onClose,
  onExecuteAction,
  incidents,
  volunteers,
  shelters,
  activeIncidentId,
  activeVolunteerId,
}) => {
  const [messages, setMessages] = useState<ProjectChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `👋 **ResQ AI Disaster Copilot online.**\n\nI am grounded in real-time telemetry from **${incidents.filter(i => i.status !== 'RESOLVED').length} active incidents**, **${volunteers.length} volunteer responders**, and **${shelters.length} relief depots**.\n\nWhether you need immediate life-safety instructions, nearest open shelter routing, or responder dispatch recommendations, ask me anything.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        "🚨 List active P1 rescues",
        "🏥 Nearest shelter with beds",
        "🚤 Available water rescue units"
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'CIVILIAN' | 'VOLUNTEER' | 'DISPATCHER'>('CIVILIAN');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clean speech synthesis if closed
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ProjectChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      roleScope: userRole,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4).map(m => ({ role: m.role, text: m.text })),
          userRole,
          activeIncidentId,
          activeVolunteerId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMsg: ProjectChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.actions || [],
          suggestedPrompts: data.suggestedPrompts || [],
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Telecommunications Degraded**: Unable to contact AI cloud server. However, local triage protocols remain active.\n\n* For life-threatening emergencies, seek immediate high ground and signal rescuers with acoustic or light pulses.\n* Current active critical incident: **INC-8921** (Elena Rostova, Marina Blvd).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: [
            { label: "Switch to Incident Radar", actionType: "NAVIGATE_TAB", payload: { tab: "map" } }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown chars for clean voice output
    const cleanSpeech = textToSpeak
      .replace(/[*#_`]/g, '')
      .replace(/\[.*?\]/g, '')
      .slice(0, 450);

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'reset-msg',
        role: 'assistant',
        text: 'Chat history cleared. Live disaster telemetry is still active. How can I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          "🚨 List active P1 rescues",
          "🏥 Nearest shelter with beds",
          "🚤 Available water rescue units"
        ]
      }
    ]);
  };

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMaximized 
        ? 'inset-2 sm:inset-6' 
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[480px] h-[82vh] max-h-[720px]'
    } flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl`}>
      {/* Chatbot Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md shadow-rose-950 ring-1 ring-rose-400/40">
            <Bot className="w-5 h-5" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white font-mono tracking-tight flex items-center gap-1.5">
                ResQ DISASTER COPILOT
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gemini 3.8 Flash • Real-time project-aware assistant
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors hidden sm:block"
            title={isMaximized ? "Restore Size" : "Maximize Screen"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Persona Role Selector Tabs */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
          <User className="w-3 h-3 text-rose-400" />
          Persona:
        </span>
        <div className="flex items-center gap-1 font-mono">
          <button
            onClick={() => setUserRole('CIVILIAN')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              userRole === 'CIVILIAN' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Civilian (In Distress)
          </button>
          <button
            onClick={() => setUserRole('VOLUNTEER')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              userRole === 'VOLUNTEER' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Volunteer Unit
          </button>
          <button
            onClick={() => setUserRole('DISPATCHER')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              userRole === 'DISPATCHER' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Commander (ICS)
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-500">
              <span>{m.role === 'user' ? 'You' : 'ResQ Copilot'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-br-none shadow-md shadow-rose-950/50'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
              }`}
            >
              {/* Message text with basic markdown rendering */}
              <div className="whitespace-pre-line space-y-1.5">
                {m.text}
              </div>

              {/* TTS Speech Trigger for Copilot responses */}
              {m.role === 'assistant' && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    onClick={() => handleSpeak(m.text)}
                    className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors font-mono"
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Mute Audio' : 'Listen Instructions'}</span>
                  </button>
                </div>
              )}

              {/* Interactive Action Buttons */}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                  {m.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => onExecuteAction(act)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm group"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-rose-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Followup suggested prompts pills */}
            {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                {m.suggestedPrompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(p)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-rose-500/40 transition-colors text-left"
                  >
                    ↳ {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono p-2">
            <Sparkles className="w-4 h-4 text-rose-500 animate-spin" />
            <span>Consulting real-time disaster radar & Gemini models...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Emergency Chips (Quick access if few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">
            Quick Emergency Inquiries:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {DEFAULT_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              userRole === 'CIVILIAN' 
                ? "I need rescue / nearest dry shelter / first aid steps..." 
                : userRole === 'VOLUNTEER'
                ? "Check unassigned P1 calls / equipment status..."
                : "Sector 4 briefing / fleet staging status..."
            }
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-rose-950 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
