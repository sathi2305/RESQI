import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Heart, 
  ShieldAlert, 
  Droplets, 
  Layers, 
  HelpCircle 
} from 'lucide-react';

interface FirstAidAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAi: (question: string) => Promise<string>;
}

const PRESET_QUESTIONS = [
  "How to stop heavy arterial bleeding on a limb with a tourniquet?",
  "What are immediate steps for severe hypothermia from flood water?",
  "How to perform CPR and proper compression rhythm?",
  "Signs of internal shock and how to position the victim?",
  "How to safely signal search and rescue boats or drones at night?",
  "What to do if trapped in a room with a natural gas leak?"
];

export const FirstAidAiModal: React.FC<FirstAidAiModalProps> = ({
  isOpen,
  onClose,
  onAskAi,
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async (qText?: string) => {
    const textToAsk = qText || question;
    if (!textToAsk.trim()) return;

    setIsLoading(true);
    setAnswer(null);
    try {
      const resp = await onAskAi(textToAsk.trim());
      setAnswer(resp);
    } catch (e) {
      setAnswer("⚠️ Unable to reach AI medic server. Default guidance: Apply firm direct pressure to bleeding, keep patient warm, do not enter electrified water, call 911 immediately.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                RESQ AI EMERGENCY MEDIC ASSISTANT
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  GEMINI 3.8 FLASH
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Immediate, calm wilderness and disaster first aid survival protocols.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕ Close
          </button>
        </div>

        {/* Quick Presets */}
        <div className="shrink-0 space-y-2">
          <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            Quick Emergency Topics:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/50 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Output Display */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-200 text-xs leading-relaxed space-y-3">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-spin" />
              <p className="text-xs font-mono text-slate-400">
                Synthesizing emergency trauma guidance with Gemini AI...
              </p>
            </div>
          ) : answer ? (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2">
              <div className="whitespace-pre-line">{answer}</div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p>Type any urgent first aid or survival question above or pick a quick topic.</p>
              <p className="text-[11px] text-slate-600">e.g. "How to treat severe chemical burn" or "What to do if baby is shivering in flood"</p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }} 
          className="flex gap-2 pt-2 border-t border-slate-800 shrink-0"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask emergency question (e.g. 'How to wrap a fractured ankle')..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consult Medic</span>
          </button>
        </form>
      </div>
    </div>
  );
};
