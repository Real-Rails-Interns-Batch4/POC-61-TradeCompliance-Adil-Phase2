"use client";
import { useState } from "react";

interface TopbarProps {
  stationCount: number;
  dataSource:   string;
  isLoading:    boolean;
}

export function Topbar({ stationCount, dataSource, isLoading }: TopbarProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Floating Transparent Topbar Container */}
      <header className="absolute top-4 left-4 right-4 h-14 glass rounded-xl flex items-center px-5 gap-3 shrink-0 z-50 liquid-glow">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isLoading
                ? "bg-yellow-500 animate-pulse"
                : "bg-dex-cyan animate-pulse-glow"
            }`}
          />
          <span className="text-white text-xs font-bold tracking-wider hidden sm:block">
            INFOCREON · TRADE COMPLIANCE
          </span>
        </div>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <span className="text-gray-400 text-xs font-mono tracking-wide hidden md:block">
          TRADE COMPLIANCE INTELLIGENCE · POC-61
        </span>

        <div className="ml-auto flex items-center gap-3">
          {isLoading ? (
            <span className="font-mono text-[10px] border border-yellow-500 text-yellow-500 px-2.5 py-1 rounded-md tracking-widest bg-yellow-500/10">
              LOADING...
            </span>
          ) : (
            <span className="font-mono text-[11px] text-dex-cyan font-bold">
              {stationCount.toLocaleString()} stations
            </span>
          )}

          {/* Info trigger button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-white text-xs font-mono font-bold hover:bg-white/10 transition-all cursor-pointer"
          >
            i
          </button>
        </div>
      </header>

      {/* Developer Signature Modal popover */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="glass border border-white/10 p-6 rounded-2xl w-80 font-mono text-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-base mb-4 border-b border-white/10 pb-2">
              SYSTEM ARCHITECT
            </h3>
            <div className="space-y-2 text-xs">
              <p><span className="text-gray-400">Architect:</span> <span className="text-white font-bold">Adil Abdulla</span></p>
              <p><span className="text-gray-400">Batch:</span> <span className="text-dex-cyan font-bold">Batch 4 Interns</span></p>
              <p><span className="text-gray-400">Stack:</span> <span className="text-gray-200">Next.js, FastAPI, Tailwind CSS, MapLibre GL</span></p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-2 rounded-lg bg-dex-cyan/20 hover:bg-dex-cyan/30 border border-dex-cyan/30 text-dex-cyan font-bold transition cursor-pointer text-xs"
            >
              CLOSE IDENTITY
            </button>
          </div>
        </div>
      )}
    </>
  );
}