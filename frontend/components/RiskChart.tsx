"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface RiskSegment {
  label: string;
  value: number;
  color: string;
}

interface RiskChartProps {
  metrics: {
    total_shipments: number;
    status_filter: string;
  } | null;
  shipments: any[];
}

export default function RiskChart({ metrics, shipments }: RiskChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 160;
    const height = 160;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.6;

    // Calculate dynamic segments
    const counts = { CLEARED: 0, IN_TRANSIT: 0, CUSTOMS_HOLD: 0, OFAC_FLAGGED: 0 };
    shipments.forEach((s) => {
      if (counts[s.status as keyof typeof counts] !== undefined) {
        counts[s.status as keyof typeof counts]++;
      }
    });

    const activeFilter = metrics?.status_filter || "ALL";
    const segments = [
      { label: "Cleared", value: counts.CLEARED, color: "#38BDF8" },
      { label: "In Transit", value: counts.IN_TRANSIT, color: "#818CF8" },
      { label: "Customs Hold", value: counts.CUSTOMS_HOLD, color: "#FBBF24" },
      { label: "OFAC Flagged", value: counts.OFAC_FLAGGED, color: "#EF4444" },
    ].map((s) => ({
      ...s,
      opacity: activeFilter === "ALL" || s.label.toUpperCase().replace(" ", "_") === activeFilter ? 1 : 0.2,
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<RiskSegment & { opacity: number }>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.03);

    const arc = d3
      .arc<d3.PieArcDatum<RiskSegment & { opacity: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(3);

    // Draw arcs
    g.selectAll("path")
      .data(pie(segments))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("opacity", (d) => d.data.opacity)
      .attr("stroke", "#020B12")
      .attr("stroke-width", 2)
      .transition()
      .duration(600)
      .attrTween("d", function (d) {
        const interp = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interp(t)) || "";
        };
      });

    // Center text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("fill", "#F1F5F9")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .text(metrics?.total_shipments?.toLocaleString() || "—");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("fill", "#6B7280")
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .attr("text-transform", "uppercase")
      .attr("letter-spacing", "1px")
      .text("TRACES");
  }, [metrics, shipments]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} />
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        {[
          { label: "Cleared", color: "#38BDF8" },
          { label: "In Transit", color: "#818CF8" },
          { label: "Customs Hold", color: "#FBBF24" },
          { label: "OFAC Flagged", color: "#EF4444" },
        ].map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[9px] text-gray-400 font-mono">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
