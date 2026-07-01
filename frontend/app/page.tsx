"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import ShipmentsTable from "@/components/ShipmentsTable";
import CinematicHeader from "@/components/CinematicHeader";
import {
  ChevronUp,
  ChevronDown,
  Layers,
  Zap,
  X,
  Network,
  SlidersHorizontal,
} from "lucide-react";
import type { MetricsResponse, Shipment, AlertsResponse } from "@/types/api";

// ── Dynamic imports (SSR disabled) ─────────────────────────────────────

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), { ssr: false });
const NetworkView = dynamic(() => import("@/components/NetworkView"), { ssr: false });

// ── Page Component ─────────────────────────────────────────────────────

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  // ── State ─────────────────────────────────────────────────────────────
  const [backendMetrics, setBackendMetrics] = useState<MetricsResponse | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [ports, setPorts] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSku, setSelectedSku] = useState("SKU-9921-A");
  const [isLoading, setIsLoading] = useState(true);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphMode, setGraphMode] = useState<"reactflow" | "visnetwork">("reactflow");
  const [showTable, setShowTable] = useState(false);

  // ── Cinematic Intelligence Panel state ──────────────────────────────
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null);

  // ── Node click handler (passed to graph components) ──────────────────
  const handleNodeClick = useCallback((nodeId: string, nodeLabel?: string) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeLabel(nodeLabel ?? nodeId);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // ── Fetch ports ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const res = await fetch(`${API}/api/ports`);
        if (res.ok) {
          const json = await res.json();
          setPorts(json.data);
        }
      } catch (e) {
        console.error("Ports fetch failed:", e);
      }
    };
    fetchPorts();
  }, [API]);

  // ── Fetch metrics ─────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      try {
        setError(null);
        const res = await fetch(`${API}/api/metrics?status=${statusFilter}`);
        if (!res.ok) throw new Error(`API responded with status ${res.status}`);
        const json: MetricsResponse = await res.json();
        if (isMounted) setBackendMetrics(json);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to connect to backend";
        if (isMounted) setError(message);
        console.error("Metrics fetch failed:", e);
      } finally {
        if (isMounted && showLoading) setIsLoading(false);
      }
    };

    fetchMetrics(true);
    const intervalId = setInterval(() => fetchMetrics(false), 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API, statusFilter]);

  // ── Fetch shipments ───────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchShipments = async () => {
      try {
        const res = await fetch(`${API}/api/shipments?status=${statusFilter}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setShipments(json.data);
            if (json.data.length > 0 && selectedSku === "SKU-9921-A") {
              setSelectedSku(json.data[0].sku_id);
            }
          }
        }
      } catch {
        console.error("Shipments fetch failed");
      } finally {
        if (isMounted) setShipmentsLoading(false);
      }
    };

    setShipmentsLoading(true);
    fetchShipments();
    const intervalId = setInterval(fetchShipments, 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API, statusFilter, selectedSku]);

  // ── Fetch alert count ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API}/api/alerts`);
        if (res.ok) {
          const json: AlertsResponse = await res.json();
          if (isMounted) setAlertCount(json.total);
        }
      } catch {
        // Silently fail — alert count is non-critical
      }
    };

    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API]);

  // ── Derived values ────────────────────────────────────────────────────
  const metrics = backendMetrics?.data ?? null;
  const stationCount = metrics?.active_nodes ?? 0;

  // Derive node detail from selected node
  const selectedPort = ports.find(
    (p) =>
      selectedNodeId === `origin-${p.osm_node_id}` ||
      selectedNodeId === `dest-${p.osm_node_id}` ||
      selectedNodeId === "checkpoint"
  );
  const relatedShipments = selectedPort
    ? shipments.filter(
        (s) =>
          s.origin_port === selectedPort.name ||
          s.destination_port === selectedPort.name
      )
    : [];

  return (
    <div className="w-screen h-screen bg-[#040A0F] text-[#E2EDF5] flex flex-col overflow-hidden">
      {/* ── Cinematic Header ── */}
      <CinematicHeader
        stationCount={stationCount}
        isLoading={isLoading}
        alertCount={alertCount}
      />

      {/* ── Error Banner ── */}
      {error && (
        <div className="w-full bg-[#F43F5E]/10 border-b border-[#F43F5E]/30 px-5 py-2 flex items-center gap-2 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] animate-pulse" />
          <span className="text-[#F43F5E] font-mono text-[10px] uppercase tracking-wider">
            Backend Offline — {error}
          </span>
        </div>
      )}

      {/* ── Full-Screen Stage ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Graph toggle — top-left floating pill */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1 bg-[#070E15]/90 backdrop-blur-md border border-[#0F2030] rounded-xl p-1 shadow-2xl">
          <button
            id="graph-mode-reactflow"
            onClick={() => setGraphMode("reactflow")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              graphMode === "reactflow"
                ? "bg-[#040A0F] text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_12px_rgba(0,212,255,0.2)]"
                : "text-[#7A9AB5] hover:text-white"
            }`}
          >
            <Layers className="w-3 h-3" />
            React Flow
          </button>
          <button
            id="graph-mode-visnetwork"
            onClick={() => setGraphMode("visnetwork")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              graphMode === "visnetwork"
                ? "bg-[#040A0F] text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_12px_rgba(0,212,255,0.2)]"
                : "text-[#7A9AB5] hover:text-white"
            }`}
          >
            <Zap className="w-3 h-3" />
            vis-network
          </button>
        </div>

        {/* Open Intelligence Panel button — top-right floating */}
        {!isPanelOpen && (
          <button
            id="open-intelligence-panel"
            onClick={() => setIsPanelOpen(true)}
            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#070E15]/90 backdrop-blur-md border border-[#00D4FF]/25 text-[#00D4FF] font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/60 transition-all shadow-2xl group"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            Intelligence Panel
          </button>
        )}

        {/* ── Graph stage (100% full screen) ── */}
        <div className="w-full h-full flex flex-col">
          <div className="flex-1">
            {graphMode === "reactflow" ? (
              <NetworkGraph
                statusFilter={statusFilter}
                ports={ports}
                shipments={shipments}
                onNodeClick={handleNodeClick}
              />
            ) : (
              <NetworkView
                statusFilter={statusFilter}
                ports={ports}
                shipments={shipments}
                onNodeClick={(nodeId) => handleNodeClick(nodeId)}
              />
            )}
          </div>

          {/* ── Collapsible Shipments Table ── */}
          <div
            className={`border-t border-[#0F2030] bg-[#060C12] transition-all duration-300 flex-shrink-0 ${
              showTable ? "h-[280px]" : "h-10"
            }`}
          >
            <button
              id="toggle-shipments-table"
              onClick={() => setShowTable(!showTable)}
              className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A9AB5] hover:text-[#00D4FF] transition-colors border-b border-[#0F2030]"
            >
              {showTable ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
              Shipments Table ({shipments.length} records · UN Comtrade HS6)
            </button>
            {showTable && (
              <div className="p-4 h-[240px] overflow-auto">
                <ShipmentsTable shipments={shipments} isLoading={shipmentsLoading} />
              </div>
            )}
          </div>
        </div>

        {/* ── Intelligence Slide-Over Panel ── */}
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-40 animate-fade-in"
              onClick={handleClosePanel}
            />

            {/* Panel */}
            <aside
              id="intelligence-panel"
              className="intelligence-panel absolute top-0 right-0 h-full w-[420px] z-50 animate-slide-in-right flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F2030] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-white font-mono font-bold text-xs tracking-widest uppercase">
                    Intelligence Panel
                  </span>
                  {selectedNodeLabel && (
                    <span className="px-2 py-0.5 rounded border border-[#00D4FF]/20 bg-[#00D4FF]/5 text-[#00D4FF] font-mono text-[9px] font-bold tracking-wider truncate max-w-[120px]">
                      {selectedNodeLabel.replace(/\n/g, " ").slice(0, 24)}
                    </span>
                  )}
                </div>
                <button
                  id="close-intelligence-panel"
                  onClick={handleClosePanel}
                  className="w-7 h-7 rounded-lg border border-[#0F2030] bg-[#070E15] flex items-center justify-center text-[#7A9AB5] hover:text-white hover:border-[#00D4FF]/30 transition-all"
                  title="Close panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Panel scroll area */}
              <div className="flex-1 overflow-y-auto">
                {/* Node detail summary */}
                {selectedNodeId && (
                  <div className="mx-4 mt-4 p-4 rounded-xl border border-[#0F2030] bg-[#040A0F]/60">
                    <p className="text-[#7A9AB5] font-mono text-[9px] uppercase tracking-widest mb-1">
                      Selected Node
                    </p>
                    <p className="text-[#00D4FF] font-mono text-sm font-bold break-all">
                      {selectedNodeLabel?.replace(/\n/g, " ") ?? selectedNodeId}
                    </p>
                    {selectedPort && (
                      <div className="mt-2 space-y-1">
                        <InfoRow label="Country" value={selectedPort.country ?? "—"} />
                        <InfoRow label="Type" value={selectedPort.port_type?.toUpperCase() ?? "—"} />
                        <InfoRow
                          label="Coordinates"
                          value={`${selectedPort.lat?.toFixed(3) ?? "?"}, ${selectedPort.lon?.toFixed(3) ?? "?"}`}
                        />
                      </div>
                    )}
                    {relatedShipments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[#7A9AB5] font-mono text-[9px] uppercase tracking-widest mb-1">
                          Related Shipments
                        </p>
                        <p className="text-white font-mono font-bold text-sm">
                          {relatedShipments.length}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sidebar content */}
                <div className="px-4 pb-4">
                  <Sidebar
                    metrics={metrics}
                    shipments={shipments}
                    isOpen={true}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    selectedSku={selectedSku}
                    setSelectedSku={setSelectedSku}
                    apiBase={API}
                    alertCount={alertCount}
                  />
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper component ─────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#3D5A70] font-mono text-[9px] uppercase tracking-wider">{label}</span>
      <span className="text-[#E2EDF5] font-mono text-[10px]">{value}</span>
    </div>
  );
}
