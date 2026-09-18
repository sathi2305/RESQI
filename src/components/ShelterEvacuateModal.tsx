import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  CheckCircle, 
  MapPin, 
  Droplet, 
  Zap, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import type { Incident, Shelter } from '../types.ts';

interface ShelterEvacuateModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  shelters: Shelter[];
  onEvacuate: (shelterId: string, incidentId: string, count: number) => Promise<void>;
}

export const ShelterEvacuateModal: React.FC<ShelterEvacuateModalProps> = ({
  isOpen,
  onClose,
  incident,
  shelters,
  onEvacuate,
}) => {
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id || '');
  const [peopleCount, setPeopleCount] = useState<number>(
    incident ? (incident.peopleCount.adults + incident.peopleCount.children) : 1
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !incident) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelterId) return;

    setIsSubmitting(true);
    try {
      await onEvacuate(selectedShelterId, incident.id, peopleCount);
      onClose();
    } catch (err) {
      alert('Failed to route evacuees to shelter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                EVACUATION SHELTER ROUTING
              </h3>
              <p className="text-xs text-slate-400">
                Route victims from incident <span className="font-mono text-white font-bold">{incident.id}</span> ({incident.reporterName}) to an active relief hub.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Evacuee Count */}
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Number of Individuals to Shelter:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={50}
                value={peopleCount}
                onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-28 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-sm px-3 py-2 rounded-xl focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-mono">
                (Includes {incident.peopleCount.adults} adults, {incident.peopleCount.children} children)
              </span>
            </div>
          </div>

          {/* Shelter Options */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">
              Select Destination Relief Hub:
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {shelters.map((sh) => {
                const remaining = sh.capacity - sh.occupied;
                const pct = Math.round((sh.occupied / sh.capacity) * 100);
                const isSelected = selectedShelterId === sh.id;
                const canFit = remaining >= peopleCount;

                return (
                  <div
                    key={sh.id}
                    onClick={() => canFit && setSelectedShelterId(sh.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50'
                        : canFit
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-400" />
                        {sh.name}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        canFit ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                      }`}>
                        {remaining} Beds Available ({pct}% Full)
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{sh.location.address}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>{sh.medicalStaffPresent ? '✅ Med Staff Present' : '⚠️ No Physician'}</span>
                      <span>•</span>
                      <span>{sh.supplies.powerGenerators} GenSets</span>
                      <span>•</span>
                      <span>{sh.supplies.waterBottles} Water Bottles</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedShelterId}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-950"
            >
              <span>{isSubmitting ? 'Routing...' : 'Confirm Evac Transfer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
