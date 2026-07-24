"use client";

import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import type { PortLocation, Shipment } from "@/types/api";

interface NetworkViewProps {
  statusFilter: string;
  ports: PortLocation[];
  shipments: Shipment[];
  onNodeClick?: (nodeId: string, nodeLabel?: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  CLEARED:      "#00D4FF",
  IN_TRANSIT:   "#7C6EFA",
  CUSTOMS_HOLD: "#F59E0B",
  OFAC_FLAGGED: "#F43F5E",
};

export default function NetworkView({
  statusFilter,
  ports,
  shipments,
  onNodeClick,
}: NetworkViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef   = useRef<Network | null>(null);

  const activeShipments = shipments.filter(
    (s) => statusFilter === "ALL" || s.status === statusFilter
  );
  const isEmpty = activeShipments.length === 0 || ports.length === 0;

  useEffect(() => {
    // Destroy any existing network before doing anything
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    if (!containerRef.current || isEmpty) return;

    const checkpoint = ports.find((p) => p.port_type === "checkpoint") || ports[0];
    const portMap = new Map(ports.map((p) => [p.name, p]));

    // Count traffic per port
    const originCounts = new Map<string, number>();
    const destCounts   = new Map<string, number>();
    activeShipments.forEach((s) => {
      if (portMap.has(s.origin_port)) {
        originCounts.set(s.origin_port, (originCounts.get(s.origin_port) || 0) + 1);
      }
      if (portMap.has(s.destination_port)) {
        destCounts.set(s.destination_port, (destCounts.get(s.destination_port) || 0) + 1);
      }
    });

    const topOrigins = Array.from(originCounts.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 10).map((e) => e[0]);
    const topDests = Array.from(destCounts.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 10).map((e) => e[0]);

    if (topOrigins.length === 0 && topDests.length === 0) return;

    const activeOrigins = new Set(topOrigins);
    const activeDests   = new Set(topDests);

    const labelMap = new Map<string, string>();
    const rawNodes: any[] = [];

    const checkpointLabel = checkpoint.name.split(" ").slice(0, 2).join(" ").toUpperCase();
    labelMap.set("checkpoint", checkpointLabel);
    rawNodes.push({
      id: "checkpoint", label: checkpointLabel,
      group: "checkpoint", title: "GLOBAL COMPLIANCE CHECKPOINT", level: 1,
    });

    activeOrigins.forEach((name) => {
      const p = portMap.get(name)!;
      const nodeId    = `origin-${p.osm_node_id}`;
      const nodeLabel = `${p.name.split(" ").slice(0, 2).join(" ").toUpperCase()} (ORIGIN)`;
      labelMap.set(nodeId, nodeLabel);
      rawNodes.push({
        id: nodeId, label: nodeLabel.replace(" (ORIGIN)", "\n(ORIGIN)"),
        group: "port", title: `${p.name} · ${p.country} · Origin`, level: 0,
      });
    });

    activeDests.forEach((name) => {
      const p = portMap.get(name)!;
      const nodeId    = `dest-${p.osm_node_id}`;
      const nodeLabel = `${p.name.split(" ").slice(0, 2).join(" ").toUpperCase()} (DEST)`;
      labelMap.set(nodeId, nodeLabel);
      rawNodes.push({
        id: nodeId, label: nodeLabel.replace(" (DEST)", "\n(DEST)"),
        group: "port", title: `${p.name} · ${p.country} · Destination`, level: 2,
      });
    });

    const edgeColor = statusFilter === "ALL"
      ? "#1E3A4E"
      : STATUS_COLORS[statusFilter] || "#1E3A4E";
    const isDashed = statusFilter === "OFAC_FLAGGED";
    const rawEdges: any[] = [];

    activeOrigins.forEach((name) => {
      const p = portMap.get(name)!;
      rawEdges.push({
        id: `edge-orig-${p.osm_node_id}`,
        from: `origin-${p.osm_node_id}`,
        to: "checkpoint",
        color: { color: edgeColor, highlight: edgeColor },
      });
    });

    activeDests.forEach((name) => {
      const p = portMap.get(name)!;
      rawEdges.push({
        id: `edge-dest-${p.osm_node_id}`,
        from: "checkpoint",
        to: `dest-${p.osm_node_id}`,
        color:  { color: edgeColor, highlight: edgeColor },
        dashes: isDashed ? [5, 5] : false,
      });
    });

    try {
      const network = new Network(
        containerRef.current,
        { nodes: new DataSet(rawNodes), edges: new DataSet(rawEdges) },
        {
          nodes: {
            shape: "box",
            font: { face: "monospace", size: 10, color: "#DCF0FF", multi: true },
            color: {
              background: "#050F18", border: "#0C1E2E",
              highlight: { background: "#030E18", border: "#00D4FF" },
              hover:     { background: "#030E18", border: "#00D4FF" },
            },
            borderWidth: 1, borderWidthSelected: 2,
            margin: { top: 10, bottom: 10, left: 12, right: 12 },
          },
          edges: {
            width: 1.5,
            arrows: { to: { enabled: true, scaleFactor: 0.6 } },
            smooth: { enabled: true, type: "cubicBezier", roundness: 0.5 },
          },
          groups: {
            port:       { color: { background: "#050F18", border: "#0C1E2E" } },
            checkpoint: {
              color: { background: "#030E18", border: "#00D4FF" },
              borderWidth: 1,
              shapeProperties: { borderDashes: [4, 4] },
            },
          },
          layout: {
            hierarchical: {
              enabled: true, direction: "LR",
              sortMethod: "directed", levelSeparation: 350, nodeSpacing: 100,
            },
          },
          physics: { enabled: false },
          interaction: { hover: true, tooltipDelay: 100, dragNodes: true },
        }
      );

      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = String(params.nodes[0]);
          const label  = labelMap.get(nodeId) ?? nodeId;
          onNodeClick?.(nodeId, label);
        }
      });

      networkRef.current = network;
    } catch (err) {
      console.error("vis-network render error:", err);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  // Re-run whenever data or filter changes; key={statusFilter} on the parent
  // ensures a full remount on filter switch, but we also handle data-arrival here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, ports.length, shipments.length]);

  return (
    <div className="w-full h-full relative">
      {isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#020B12]">
          <div className="bg-[#050F18] border border-[#0C1E2E] rounded-2xl px-8 py-6 text-center max-w-sm shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#0C1E2E] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#2E4A60]" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-[#DCF0FF] font-mono font-bold text-sm mb-1">NO SHIPMENTS</p>
            <p className="text-[#6A9BB8] font-mono text-[10px] leading-relaxed">
              No traffic recorded for{" "}
              <span className="text-[#F59E0B]">{statusFilter.replace(/_/g, " ")}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full bg-[#020B12]" />
      )}

      <div className="absolute bottom-3 left-3 bg-[#050F18]/85 backdrop-blur-md border border-[#0C1E2E] px-3 py-1.5 rounded-md">
        <span className="text-[9px] font-mono text-[#2E4A60] uppercase tracking-wider">
          vis-network · {isEmpty ? "no data" : `hierarchical layout · ${Math.min(21, ports.length)} nodes`}
        </span>
      </div>
    </div>
  );
}
