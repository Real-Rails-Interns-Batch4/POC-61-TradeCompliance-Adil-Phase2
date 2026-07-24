"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ComplianceAlert, AlertsResponse } from "@/types/api";

interface AlertsFeedProps {
  apiBase: string;
}

const SEVERITY_ICON: Record<string, React.ElementType> = {
  CRITICAL: AlertTriangle,
  WARNING: AlertCircle,
  INFO: Info,
};

const SEVERITY_VARIANT: Record<string, "critical" | "warning" | "info"> = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "text-[#EF4444]",
  WARNING: "text-[#FBBF24]",
  INFO: "text-[#38BDF8]",
};

// Cap how many alerts we render in the DOM — prevents janking when 300 are returned
const ALERT_DISPLAY_LIMIT = 50;

export default function AlertsFeed({ apiBase }: AlertsFeedProps) {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${apiBase}/api/alerts`);
        if (res.ok) {
          const json: AlertsResponse = await res.json();
          setAlerts(json.data);
        }
      } catch {
        console.error("Failed to fetch alerts");
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [apiBase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 text-[11px] font-mono">
        <div className="w-3 h-3 rounded-full bg-[#38BDF8] animate-pulse mr-2" />
        Loading alerts...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-[11px] font-mono">
        <Bell className="w-6 h-6 mb-2 opacity-40" />
        <p>No active compliance alerts</p>
      </div>
    );
  }

  const visibleAlerts = alerts.slice(0, ALERT_DISPLAY_LIMIT);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
          Live Compliance Feed
        </p>
        <Badge variant="critical">{alerts.filter(a => a.severity === "CRITICAL").length} critical</Badge>
      </div>
      {alerts.length > ALERT_DISPLAY_LIMIT && (
        <p className="text-[9px] text-[#6A9BB8] font-mono mb-2">
          Showing {ALERT_DISPLAY_LIMIT} of {alerts.length} alerts
        </p>
      )}
      {visibleAlerts.map((alert) => {
        const Icon = SEVERITY_ICON[alert.severity] || Info;
        return (
          <div
            key={alert.alert_id}
            className="bg-[#1F2937]/40 border border-[#1F2937] p-3 rounded-lg hover:border-[#38BDF8]/30 transition-colors"
          >
            <div className="flex items-start gap-2">
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${SEVERITY_COLOR[alert.severity]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-white font-bold text-[11px]">{alert.sku_id}</span>
                  <Badge variant={SEVERITY_VARIANT[alert.severity]}>{alert.severity}</Badge>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">{alert.message}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                  <span>{alert.source}</span>
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
