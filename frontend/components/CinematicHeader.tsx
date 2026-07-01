"use client";

import { useState, useRef, useEffect } from "react";
import { Info, X, Shield, GitBranch, Code2, Terminal, User, Hash, Layers } from "lucide-react";

interface CinematicHeaderProps {
  stationCount: number;
  isLoading: boolean;
  alertCount: number;
}

const STACK_ITEMS = [
  { icon: <Layers className="w-3 h-3" />, label: "Next.js 14" },
  { icon: <Terminal className="w-3 h-3" />, label: "FastAPI" },
  { icon: <Code2 className="w-3 h-3" />, label: "Tailwind CSS" },
  { icon: <Shield className="w-3 h-3" />, label: "React Flow" },
  { icon: <GitBranch className="w-3 h-3" />, label: "vis-network" },
];

export default function CinematicHeader({ stationCount, isLoading, alertCount }: CinematicHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    }
    if (showModal) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  return (
    <header className="header-gradient w-full h-14 flex items-center justify-between px-5 z-50 relative flex-shrink-0">
      {/* ── Left: Brand ── */}
      <div className="flex items-center gap-3">
        {/* Pulse indicator */}
        <div className="relative flex items-center justify-center w-7 h-7">
          <div className="absolute w-full h-full rounded-full bg-[#00D4FF] opacity-10 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-blink shadow-[0_0_10px_#00D4FF]" />
        </div>

        {/* Title block */}
        <div className="flex flex-col leading-tight">
          <span className="text-[9px] font-mono font-semibold tracking-[0.25em] text-[#00D4FF] uppercase opacity-80">
            Infocreon Internship
          </span>
          <h1 className="text-white font-mono font-bold tracking-widest text-[11px] uppercase">
            Trade Compliance Intelligence
          </h1>
        </div>

        {/* POC Badge */}
        <div className="ml-1 px-2 py-0.5 rounded border border-[#00D4FF]/20 bg-[#00D4FF]/5">
          <span className="text-[#00D4FF] font-mono text-[9px] font-bold tracking-widest">
            POC-61
          </span>
        </div>

        {/* Synthetic Data badge */}
        <div className="px-2 py-0.5 rounded border border-[#F59E0B]/25 bg-[#F59E0B]/5">
          <span className="text-[#F59E0B] font-mono text-[9px] font-bold tracking-widest">
            SYNTHETIC DATA
          </span>
        </div>
      </div>

      {/* ── Center: Live metrics strip ── */}
      <div className="hidden md:flex items-center gap-6 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-blink" />
          <span className="text-[#7A9AB5]">NETWORK</span>
          <span className="text-[#00D4FF] font-semibold">SECURE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#7A9AB5]">NODES</span>
          <span className="text-white font-bold">{isLoading ? "SYNC..." : stationCount}</span>
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] animate-pulse" />
            <span className="text-[#7A9AB5]">ALERTS</span>
            <span className="text-[#F43F5E] font-bold">{alertCount}</span>
          </div>
        )}
      </div>

      {/* ── Right: (i) Info icon ── */}
      <div className="relative" ref={modalRef}>
        <button
          id="dev-signature-btn"
          onClick={() => setShowModal((v) => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 hover:bg-[#00D4FF]/15 hover:border-[#00D4FF]/50 transition-all duration-200 group"
          title="Developer Signature"
          aria-label="Open developer metadata"
        >
          <Info className="w-4 h-4 text-[#00D4FF] group-hover:scale-110 transition-transform" />
        </button>

        {/* ── Metadata Modal ── */}
        {showModal && (
          <div
            id="dev-metadata-modal"
            className="metadata-modal animate-modal-pop absolute right-0 top-11 w-80 rounded-2xl p-5 z-[999]"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-[#00D4FF]" />
                <span className="text-white font-mono font-bold text-xs tracking-widest uppercase">
                  Developer Signature
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#7A9AB5] hover:text-white hover:bg-[#0F2030] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metadata rows */}
            <div className="space-y-3 mb-4">
              <MetaRow icon={<User className="w-3.5 h-3.5" />} label="Architect" value="Adil Abdulla" accent />
              <MetaRow icon={<Hash className="w-3.5 h-3.5" />} label="POC ID" value="POC-61" />
              <MetaRow
                icon={<GitBranch className="w-3.5 h-3.5" />}
                label="GitHub"
                value="Theadilabdulla"
              />
              <MetaRow icon={<Shield className="w-3.5 h-3.5" />} label="Batch" value="Interns Batch 4" />
              <MetaRow icon={<Layers className="w-3.5 h-3.5" />} label="Rail" value="Trade Compliance" />
            </div>

            {/* Stack chips */}
            <div className="border-t border-[#0F2030] pt-4">
              <p className="text-[#7A9AB5] font-mono text-[9px] tracking-widest uppercase mb-2.5">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {STACK_ITEMS.map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1 px-2 py-1 rounded-md border border-[#0F2030] bg-[#040A0F] text-[#7A9AB5] font-mono text-[9px] hover:border-[#00D4FF]/30 hover:text-[#00D4FF] transition-colors"
                  >
                    {icon}
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-[#0F2030] pt-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-blink" />
              <span className="text-[#3D5A70] font-mono text-[9px] tracking-wider">
                Infocreon Internship · 2025 · Production Build
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MetaRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[#7A9AB5]">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={`font-mono text-[11px] font-semibold ${
          accent ? "text-[#00D4FF]" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
