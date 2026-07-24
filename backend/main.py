"""
Trade Compliance API — backend/main.py
======================================

Lightweight FastAPI server that:
  - Serves port locations from Overpass/OSM adapter
  - Serves shipment data from UN Comtrade adapter
  - Computes metrics dynamically from live shipment data
  - Loads configuration from data.json (no hardcoded data)
  - Strictly follows 70:30 ratio (700 Cleared / 300 Customs Hold)
"""

import os
import sys
import json
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone

# Add the project root to sys.path so adapters/ can be imported
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from adapters import comtrade_adapter

# ── Load external config from data.json ────────────────────────────────

DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "data.json")


def load_config() -> dict:
    """Load the externalized data configuration from data.json."""
    if not os.path.exists(DATA_FILE_PATH):
        return {}
    with open(DATA_FILE_PATH, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


CONFIG = load_config()


# ── Pydantic Response Models ────────────────────────────────────────────

class NetworkMetrics(BaseModel):
    """Core metric payload for a given network filter state."""
    total_shipments: int
    value_at_risk: float  # USD in millions
    active_nodes: int
    status_filter: str


class MetricsResponse(BaseModel):
    """Envelope wrapping NetworkMetrics with metadata."""
    data: NetworkMetrics
    timestamp: str
    source: str


class Shipment(BaseModel):
    """A single trade-compliance shipment record."""
    sku_id: str
    hs_code: str
    description: str
    origin_port: str
    origin_country: str
    destination_port: str
    destination_country: str
    status: str
    value_usd: float
    carrier: str
    departure_date: str
    eta: str


class ShipmentsResponse(BaseModel):
    """Paginated envelope for shipment records."""
    data: list[Shipment]
    total: int
    timestamp: str
    source: str


class ComplianceAlert(BaseModel):
    """A compliance alert raised by screening or customs systems."""
    alert_id: str
    severity: str
    sku_id: str
    message: str
    timestamp: str
    source: str


class AlertsResponse(BaseModel):
    """Envelope for compliance alerts."""
    data: list[ComplianceAlert]
    total: int
    timestamp: str
    source: str


class TradeDocument(BaseModel):
    """A single document in a shipment's compliance checklist."""
    doc_type: str
    doc_name: str
    status: str
    reference_number: str | None = None
    issued_by: str | None = None
    issued_date: str | None = None


class DocumentsResponse(BaseModel):
    """Envelope for a SKU's document checklist."""
    sku_id: str
    data: list[TradeDocument]
    timestamp: str
    source: str


class PortsResponse(BaseModel):
    """Envelope for port location data."""
    data: list[dict]
    timestamp: str
    source: str


# ── FastAPI App ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Trade Compliance API",
    version="0.3.0",
    description="POC-61 · Data from UN Comtrade & Overpass/OSM · 70:30 ratio",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/ports", response_model=PortsResponse)
def get_ports() -> PortsResponse:
    """Return port locations sourced from Overpass API / OpenStreetMap."""
    from adapters.overpass_adapter import get_port_locations
    ports = get_port_locations()
    return PortsResponse(
        data=ports,
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="Overpass API / OpenStreetMap",
    )


@app.get("/api/metrics", response_model=MetricsResponse)
def get_metrics(status: str = Query("ALL")) -> MetricsResponse:
    """Return network metrics computed dynamically from actual shipment data."""
    records = comtrade_adapter.get_shipments(status)

    total = len(records)
    value_at_risk = round(sum(r["value_usd"] for r in records) / 1_000_000, 2)

    # Determine data source label based on the filter
    ratio_config = CONFIG.get("ratio", {})
    data_sources = ratio_config.get("data_sources", {})

    if status == "CLEARED":
        source = data_sources.get("cleared", "UN Comtrade")
    elif status == "CUSTOMS_HOLD":
        source = data_sources.get("customs_hold", "Overpass API / OpenStreetMap")
    else:
        source = "UN Comtrade & Overpass API / OpenStreetMap"

    return MetricsResponse(
        data=NetworkMetrics(
            total_shipments=total,
            value_at_risk=value_at_risk,
            active_nodes=total,
            status_filter=status,
        ),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source=source,
    )


@app.get("/api/shipments", response_model=ShipmentsResponse)
def get_shipments(status: str = Query("ALL")) -> ShipmentsResponse:
    """Return shipment records, optionally filtered by status."""
    records = comtrade_adapter.get_shipments(status)
    return ShipmentsResponse(
        data=[Shipment(**r) for r in records],
        total=len(records),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="UN Comtrade & Overpass API / OpenStreetMap",
    )


@app.get("/api/alerts", response_model=AlertsResponse)
def get_alerts() -> AlertsResponse:
    """Return all active compliance alerts sorted by severity."""
    records = comtrade_adapter.get_alerts()
    return AlertsResponse(
        data=[ComplianceAlert(**r) for r in records],
        total=len(records),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="UN Comtrade",
    )


@app.get("/api/documents/{sku_id}", response_model=DocumentsResponse)
def get_documents(sku_id: str) -> DocumentsResponse:
    """Return the document checklist for a given SKU."""
    records = comtrade_adapter.get_documents(sku_id)
    return DocumentsResponse(
        sku_id=sku_id,
        data=[TradeDocument(**r) for r in records],
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="UN Comtrade",
    )
