"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { getLayoutedElements } from "@/utils/dagre-layout";
import type { PortLocation, Shipment } from "@/types/api";

// ── Maritime Visual DNA node styles ──────────────────────────────────────

const nodeStyle = {
  background: "#050F18",
  color: "#DCF0FF",
  border: "1px solid #0C1E2E",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "10px",
  fontFamily: "JetBrains Mono, monospace",
};

const checkpointStyle = {
  background: "#030E18",
  color: "#00D4FF",
  border: "1px dashed #00D4FF",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "10px",
  fontFamily: "JetBrains Mono, monospace",
  boxShadow: "0 0 20px rgba(0, 212, 255, 0.15)",
};

interface NetworkGraphProps {
  statusFilter: string;
  ports: PortLocation[];
  shipments: Shipment[];
  onNodeClick?: (nodeId: string, nodeLabel: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  CLEARED:      "#00D4FF",
  IN_TRANSIT:   "#7C6EFA",
  CUSTOMS_HOLD: "#F59E0B",
  OFAC_FLAGGED: "#F43F5E",
};

export default function NetworkGraph({
  statusFilter,
  ports,
  shipments,
  onNodeClick,
}: NetworkGraphProps) {
  const { layoutedNodes, filteredEdges, isEmpty } = useMemo(() => {
    if (!ports || ports.length === 0)
      return { layoutedNodes: [], filteredEdges: [], isEmpty: true };

    const checkpoint = ports.find((p) => p.port_type === "checkpoint") || ports[0];

    // Build map of ALL ports
    const portMap = new Map(ports.map((p) => [p.name, p]));

    // Filter active shipments
    const activeShipments = shipments.filter(
      (s) => statusFilter === "ALL" || s.status === statusFilter
    );

    if (activeShipments.length === 0) {
      return { layoutedNodes: [], filteredEdges: [], isEmpty: true };
    }

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

    // Top 10 busiest origins and destinations
    const topOrigins = Array.from(originCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((e) => e[0]);

    const topDests = Array.from(destCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((e) => e[0]);

    const activeOrigins = new Set(topOrigins);
    const activeDests   = new Set(topDests);

    // Build nodes
    const rawNodes: any[] = [];

    rawNodes.push({
      id: "checkpoint",
      position: { x: 0, y: 0 },
      data: { label: checkpoint.name.toUpperCase() },
      style: checkpointStyle,
    });

    activeOrigins.forEach((name) => {
      const p = portMap.get(name)!;
      rawNodes.push({
        id: `origin-${p.osm_node_id}`,
        position: { x: 0, y: 0 },
        data: { label: `${p.name.toUpperCase()} (ORIGIN)` },
        style: nodeStyle,
      });
    });

    activeDests.forEach((name) => {
      const p = portMap.get(name)!;
      rawNodes.push({
        id: `dest-${p.osm_node_id}`,
        position: { x: 0, y: 0 },
        data: { label: `${p.name.toUpperCase()} (DEST)` },
        style: nodeStyle,
      });
    });

    // Build edges
    const rawEdges: any[] = [];
    const edgeColor = statusFilter === "ALL"
      ? "#1E3A4E"
      : STATUS_COLORS[statusFilter] || "#1E3A4E";
    const isDashed = statusFilter === "OFAC_FLAGGED";

    activeOrigins.forEach((name) => {
      const p = portMap.get(name)!;
      rawEdges.push({
        id: `edge-orig-${p.osm_node_id}`,
        source: `origin-${p.osm_node_id}`,
        target: "checkpoint",
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 1.5, opacity: 0.65 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      });
    });

    activeDests.forEach((name) => {
      const p = portMap.get(name)!;
      rawEdges.push({
        id: `edge-dest-${p.osm_node_id}`,
        source: "checkpoint",
        target: `dest-${p.osm_node_id}`,
        animated: true,
        style: {
          stroke: edgeColor,
          strokeWidth: 1.5,
          opacity: 0.65,
          strokeDasharray: isDashed ? "5 5" : "none",
        },
        label:
          isDashed || statusFilter === "CUSTOMS_HOLD" ? statusFilter : undefined,
        labelStyle: {
          fill: edgeColor,
          fontWeight: 700,
          fontFamily: "monospace",
          fontSize: 9,
        },
        labelBgStyle: { fill: "#020B12", fillOpacity: 0.92 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      });
    });

    const { nodes } = getLayoutedElements(rawNodes, rawEdges, "LR");
    return { layoutedNodes: nodes, filteredEdges: rawEdges, isEmpty: false };
  }, [statusFilter, ports, shipments]);

  return (
    <div className="w-full h-full bg-[#020B12] relative">
      {isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="bg-[#050F18] border border-[#0C1E2E] rounded-2xl px-8 py-6 text-center max-w-sm shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#0C1E2E] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#2E4A60]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-[#DCF0FF] font-mono font-bold text-sm mb-1">
              NO SHIPMENTS FOUND
            </p>
            <p className="text-[#6A9BB8] font-mono text-[10px] leading-relaxed">
              No shipments match the{" "}
              <span className="text-[#F59E0B]">
                {statusFilter.replace("_", " ")}
              </span>{" "}
              filter.
            </p>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={layoutedNodes}
          edges={filteredEdges}
          fitView
          className="dark"
          attributionPosition="bottom-left"
          minZoom={0.2}
          onNodeClick={(_e, node) => {
            onNodeClick?.(node.id, String(node.data?.label ?? node.id));
          }}
        >
          <Background color="#0C1E2E" gap={32} size={0.8} />
          <Controls
            style={{
              backgroundColor: "#050F18",
              border: "1px solid #0C1E2E",
              fill: "#DCF0FF",
            }}
          />
        </ReactFlow>
      )}
    </div>
  );
}
