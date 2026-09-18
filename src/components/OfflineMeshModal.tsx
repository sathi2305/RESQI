import React, { useState } from 'react';
import { 
  Radio, 
  Copy, 
  Check, 
  Send, 
  WifiOff, 
  Satellite, 
  DownloadCloud, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import type { Incident } from '../types.ts';

interface OfflineMeshModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onIngestPacket: (packet: string) => Promise<void>;
}

export const OfflineMeshModal: React.FC<OfflineMeshModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onIngestPacket,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents.find(i => i.status !== 'RESOLVED')?.id || incidents[0]?.id || ''
  );
  const [copied, setCopied] = useState(false);
  const [incomingPacket, setIncomingPacket] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  if (!isOpen) return null;

  const targetIncident = incidents.find(i => i.id === selectedIncidentId);

  // Compact payload format: RESQ:<PRIORITY>|<ID>|<LAT,LNG>|<CAT>|<PEOPLE>|<SUMMARY>
  const generatePacketString = (inc?: Incident) => {
    if (!inc) return 'RESQ:P1|SOS|37.7749,-122.4194|FLOOD|2A|Water rising, need boat';
    const prioCode = inc.priority.replace('_CRITICAL', '').replace('_HIGH', '').replace('_MODERATE', '').replace('_LOW', '');
    const peopleStr = `${inc.peopleCount.adults}A ${inc.peopleCount.children > 0 ? `${inc.peopleCount.children}C ` : ''}${inc.peopleCount.injured > 0 ? `${inc.peopleCount.injured}INJ` : ''}`.trim();
    const shortDesc = inc.description.slice(0, 70).replace(/[|]/g, ' ');
    return `RESQ:${prioCode}|${inc.id}|${inc.location.lat.toFixed(4)},${inc.location.lng.toFixed(4)}|${inc.category}|${peopleStr}|${shortDesc}`;
  };

  const currentPacket = generatePacketString(targetIncident);

  const handleCopyPacket = () => {
    navigator.clipboard.writeText(currentPacket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDecodeIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingPacket.trim()) return;

    setIsIngesting(true);
    try {
      await onIngestPacket(incomingPacket.trim());
      setIngestSuccess(true);
      setIncomingPacket('');
      setTimeout(() => setIngestSuccess(false), 3500);
    } catch (e) {
      alert('Failed to parse mesh packet. Check format: RESQ:P1|ID|LAT,LNG|CAT|PEOPLE|DESC');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                SATELLITE & VHF MESH TRANSCEIVER
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  ZERO-CELLULAR MODE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Low-bandwidth emergency packet encoding for Garmin inReach, SMS relays, and Ham radio (APRS).
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

        {/* Transceiver Body */}
        <div className="space-y-6 overflow-y-auto flex-1 pr-1">
          {/* Section 1: Packet Transmitter (Encode Incident to Compact String) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                <Satellite className="w-4 h-4" />
                <span>1. Encode Outgoing Emergency Packet</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">APRS / SMS COMPACT</span>
            </div>

            {/* Select Incident to Encode */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-mono">
                Select Active Incident to Transmit:
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-amber-500"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.priority.slice(0, 2)}] {inc.id} - {inc.reporterName} ({inc.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Generated Raw Payload Box */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Compressed Transmit String:</span>
                <span className="text-emerald-400 font-bold">{currentPacket.length} bytes</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between gap-3">
                <code>{currentPacket}</code>
                <button
                  onClick={handleCopyPacket}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Packet'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Transmit via Satellite SMS (911), LoRa radio terminal, or broadcast on 146.520 MHz Simplex.
              </p>
            </div>
          </div>

          {/* Section 2: Packet Receiver (Decode Incoming Radio Transmission) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                <DownloadCloud className="w-4 h-4" />
                <span>2. Ingest Incoming Field Radio/SMS Packet</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">AUTO-INGEST TO RADAR</span>
            </div>

            <form onSubmit={handleDecodeIngest} className="space-y-3">
              <textarea
                value={incomingPacket}
                onChange={(e) => setIncomingPacket(e.target.value)}
                placeholder="Paste incoming packet string (e.g. RESQ:P1|INC-9040|37.7650,-122.4220|TRAPPED|3A|Ceiling collapsed in hallway)..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
              />

              {/* Sample Preset helper buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">Sample Packets:</span>
                <button
                  type="button"
                  onClick={() => setIncomingPacket("RESQ:P1|INC-9102|37.7690,-122.4310|MEDICAL|1A 1INJ|Traumatic crush injury from fallen concrete")}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  Load Sample P1 Med
                </button>
                <button
                  type="button"
                  onClick={() => setIncomingPacket("RESQ:P2|INC-9103|37.7880,-122.4090|FLOOD|4A 2C|Water rising on 1st floor power cut")}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  Load Sample P2 Flood
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                {ingestSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Packet Decoded & Ingested into Live Board!</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Direct validation against GIS coordinates.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!incomingPacket.trim() || isIngesting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{isIngesting ? 'Decoding...' : 'Decode & Inject to Radar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
