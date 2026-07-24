"use client";

import { AlertTriangle, ShieldCheck, Download, FileText, Globe, Bell, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import DocumentPanel from "@/components/DocumentPanel";
import AlertsFeed from "@/components/AlertsFeed";
import RiskChart from "@/components/RiskChart";
import type { NetworkMetrics, Shipment } from "@/types/api";

interface SidebarProps {
  metrics: NetworkMetrics | null;
  shipments: Shipment[];
  isOpen: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  selectedSku: string;
  setSelectedSku: (sku: string) => void;
  apiBase: string;
  alertCount: number;
}

export function Sidebar({
  metrics,
  shipments,
  isOpen,
  statusFilter,
  setStatusFilter,
  selectedSku,
  setSelectedSku,
  apiBase,
  alertCount,
}: SidebarProps) {
  const downloadSampleData = () => {
    if (shipments.length === 0) return;
    const headers = Object.keys(shipments[0]).join(",");
    const rows = shipments.map((s) =>
      Object.values(s).map((v) => `"${v}"`).join(",")
    );
    const csvStr =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent([headers, ...rows].join("\n"));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", csvStr);
    downloadAnchor.setAttribute("download", "trade_compliance_shipments.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  const formatVAR = (val: number): string => `$${val.toFixed(1)}M`;

  // Compute 70/30 split counts (Safe vs Risk)
  const clearedCount     = shipments.filter((s) => s.status === "CLEARED" || s.status === "IN_TRANSIT").length;
  const customsHoldCount = shipments.filter((s) => s.status === "CUSTOMS_HOLD" || s.status === "OFAC_FLAGGED").length;
  const totalForRatio    = clearedCount + customsHoldCount || 1;
  const clearedPct       = Math.round((clearedCount / totalForRatio) * 100);
  const holdPct          = 100 - clearedPct;

  return (
    <TooltipProvider>
      <aside className="w-full h-full bg-transparent pt-4 overflow-y-auto font-mono flex flex-col justify-between text-xs z-30">
        <div>
          {/* ── Section header ── */}
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
            <h2 className="text-[#DCF0FF] font-bold tracking-wider uppercase text-sm">
              Trade Intelligence
            </h2>
          </div>

          {/* ── 70/30 Compliance Ratio Strip ── */}
          <div className="bg-[#040D16] border border-[#0C1E2E] p-3 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#6A9BB8] text-[9px] uppercase tracking-wider">
                Compliance Ratio
              </span>
              <TrendingUp className="w-3 h-3 text-[#00D4FF]" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 h-2 rounded-full bg-[#0C1E2E] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00A8CC]"
                  style={{ width: `${clearedPct}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[9px] font-mono">
              <span className="text-[#00D4FF] font-bold">{clearedPct}% CLEARED</span>
              <span className="text-[#F59E0B] font-bold">{holdPct}% HOLD</span>
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div className="bg-[#040D16] border border-[#0C1E2E] p-4 rounded-xl mb-4">
            <label className="text-[#6A9BB8] block mb-2 uppercase tracking-tight text-[10px]">
              Filter Network State:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#020B12] border border-[#0C1E2E] text-[#DCF0FF] p-2 rounded-md outline-none focus:border-[#00D4FF] transition-colors cursor-pointer text-[11px]"
            >
              <option value="ALL">ALL TRAFFIC</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="CUSTOMS_HOLD">CUSTOMS HOLD</option>
              <option value="OFAC_FLAGGED">OFAC FLAGGED / HIGH RISK</option>
              <option value="CLEARED">CLEARED TRAFFIC</option>
            </select>
          </div>

          {/* ── TABBED CONTENT ── */}
          <Tabs defaultValue="metrics" className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="metrics" className="flex-1">Metrics</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">
                <FileText className="w-3 h-3 mr-1" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex-1 relative">
                <Bell className="w-3 h-3 mr-1" />
                Alerts
                {alertCount > 0 && (
                  <span className="ml-1 bg-[#EF4444] text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                    {alertCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Metrics Tab ── */}
            <TabsContent value="metrics">
              {/* D3 Risk Chart */}
              <div className="bg-[#040D16] border border-[#0C1E2E] p-4 rounded-xl mb-4">
                <RiskChart metrics={metrics} shipments={shipments} />
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-[#040D16] border border-[#0C1E2E] p-3 rounded-xl cursor-help">
                      <p className="text-[#6A9BB8] text-[10px] uppercase">Active Traces</p>
                      <p className="text-lg font-bold text-[#DCF0FF] mt-1">
                        {metrics ? metrics.total_shipments.toLocaleString() : "..."}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total active shipment traces in the filtered network</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-[#040D16] border border-[#0C1E2E] p-3 rounded-xl cursor-help">
                      <p className="text-[#6A9BB8] text-[10px] uppercase">Value At Risk</p>
                      <p className="text-lg font-bold text-[#F43F5E] mt-1">
                        {metrics ? formatVAR(metrics.value_at_risk) : "..."}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Aggregate USD value of shipments currently at risk in this filter</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* SKU Checkpoints */}
              <div className="mb-4">
                <h3 className="text-[#6A9BB8] font-bold mb-3 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#00D4FF]" /> SKU Checkpoints
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(() => {
                    const holdShipment    = shipments.find((s) => s.status === "CUSTOMS_HOLD");
                    const clearedShipment = shipments.find((s) => s.status === "CLEARED");
                    const skuCards = [holdShipment, clearedShipment].filter(Boolean);
                    if (skuCards.length === 0)
                      return (
                        <p className="text-[#2E4A60] text-[10px]">No shipments loaded</p>
                      );
                    return skuCards.map((s) => (
                      <button
                        key={s!.sku_id}
                        onClick={() => setSelectedSku(s!.sku_id)}
                        className={`w-full text-left bg-[#040D16]/40 border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
                          selectedSku === s!.sku_id
                            ? s!.status === "CUSTOMS_HOLD"
                              ? "border-[#F59E0B]/50"
                              : "border-[#00D4FF]/50"
                            : "border-[#0C1E2E] hover:border-[#0C1E2E]/80"
                        }`}
                      >
                        <div className="flex justify-between text-[#DCF0FF] font-bold text-[11px]">
                          <span>{s!.sku_id}</span>
                          <span
                            className={
                              s!.status === "CUSTOMS_HOLD"
                                ? "text-[#F59E0B]"
                                : "text-[#00D4FF]"
                            }
                          >
                            {s!.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[#6A9BB8] text-[10px]">
                          Origin: {s!.origin_port.replace("Port of ", "")} | Dest:{" "}
                          {s!.destination_port.replace("Port of ", "")}
                        </p>
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Context panels */}
              <div className="space-y-4 border-t border-[#0C1E2E] pt-4">
                <div>
                  <h3 className="text-[#00D4FF] uppercase tracking-wider text-[10px] mb-1 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Why This Matters
                  </h3>
                  <p className="text-[#6A9BB8] leading-relaxed text-[11px]">
                    Global customs evasion accounts for billions in lost revenue. Mapping
                    cross-border flows against active parameters enables instantaneous
                    node-level validation.
                  </p>
                </div>
                <div>
                  <h3 className="text-[#00D4FF] uppercase tracking-wider text-[10px] mb-1 font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Who Controls the Rail
                  </h3>
                  <p className="text-[#6A9BB8] leading-relaxed text-[11px]">
                    Governed by inter-governmental customs alliances and sovereign port
                    authorities processing international trade manifests.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Documents Tab ── */}
            <TabsContent value="documents">
              <DocumentPanel selectedSku={selectedSku} apiBase={apiBase} />
            </TabsContent>

            {/* ── Alerts Tab ── */}
            <TabsContent value="alerts">
              <AlertsFeed apiBase={apiBase} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Download button ── */}
        <div className="pt-4 mt-4 border-t border-[#0C1E2E]">
          <button
            onClick={downloadSampleData}
            className="w-full bg-[#040D16] border border-[#00D4FF]/30 hover:border-[#00D4FF] text-[#00D4FF] py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-bold tracking-wider text-[11px] hover:shadow-[0_0_18px_rgba(0,212,255,0.2)]"
          >
            <Download className="w-3 h-3" /> DOWNLOAD SAMPLE DATA
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
