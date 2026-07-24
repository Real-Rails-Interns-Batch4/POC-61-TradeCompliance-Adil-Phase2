"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  statusFilter?: string;
};

export default function MapStage({ statusFilter = "ALL" }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; 

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [20, 35],
      zoom: 1.5,
      pitch: 45,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("trade-data", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "trace-lines",
        type: "line",
        source: "trade-data",
        filter: ["==", "type", "trace_line"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "Cleared", "#38BDF8",
            "In Transit", "#818CF8",
            "Customs Hold", "#FBBF24",
            "OFAC Flagged", "#EF4444",
            "#38BDF8"
          ],
          "line-width": 1.5,
          "line-opacity": 0.4,
        },
      });

      map.addLayer({
        id: "trade-nodes",
        type: "circle",
        source: "trade-data",
        filter: ["!=", "type", "trace_line"],
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "match",
            ["get", "status"],
            "Cleared", "#38BDF8",
            "In Transit", "#818CF8",
            "Customs Hold", "#FBBF24",
            "OFAC Flagged", "#EF4444",
            "#ffffff"
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#030712",
        },
      });

      fetchTradeData(statusFilter);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); 

  useEffect(() => {
    fetchTradeData(statusFilter);
  }, [statusFilter]);

  const fetchTradeData = async (status: string) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return; 

    try {
      const API = process.env.NEXT_PUBLIC_API_BASE_URL !== undefined ? process.env.NEXT_PUBLIC_API_BASE_URL : "http://localhost:8000";
      const res = await fetch(`${API}/api/shipments?status=${status}`);
      if (!res.ok) return;

      const data = await res.json();
      const source = map.getSource("trade-data") as maplibregl.GeoJSONSource;
      
      if (source) {
        source.setData(data);
      }
    } catch (err) {
      console.error("Failed to fetch trade routes:", err);
    }
  };

  return <div ref={containerRef} className="w-full h-full bg-[#030712]" />;
}