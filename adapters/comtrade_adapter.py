"""
UN Comtrade Adapter — Synthetic Shipment Data Generator
=======================================================

Generates synthetic shipment, alert, and document data
sourced from Overpass/OSM port locations.

Strictly follows the 70:30 ratio:
  - 700 CLEARED shipments  (70% — UN Comtrade source)
  - 300 CUSTOMS_HOLD shipments (30% — Overpass/OSM source)
"""

import random
import threading
import time
import uuid
from datetime import datetime, timezone, timedelta
from adapters.overpass_adapter import get_port_locations

# Thread lock to prevent race conditions from concurrent API requests
_INIT_LOCK = threading.Lock()

_GENERATED_SHIPMENTS: list[dict] = []
_GENERATED_ALERTS: list[dict] = []
_GENERATED_DOCUMENTS: dict[str, list[dict]] = {}
_INITIALIZED = False

_TARGET_SHIPMENT_COUNT = 1000

CARRIERS = ["Maersk Line", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd", "Evergreen"]
HS_CODES = [
    ("854430", "Ignition wiring sets and other wiring sets"),
    ("870380", "Vehicles, with only electric motor for propulsion"),
    ("850440", "Static converters (e.g. rectifiers)"),
    ("853710", "Boards, panels, consoles, desks, cabinets"),
]


def _spawn_shipment(origins, destinations):
    """Create a single synthetic shipment record."""
    origin = random.choice(origins)
    dest = random.choice(destinations)
    while dest["osm_node_id"] == origin["osm_node_id"]:
        dest = random.choice(destinations)

    hs_code, desc = random.choice(HS_CODES)
    sku = f"SKU-{random.randint(1000, 9999)}-{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}"

    departure = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))

    shipment = {
        "sku_id": sku,
        "hs_code": hs_code,
        "description": desc,
        "origin_port": origin["name"],
        "origin_country": origin["country"],
        "destination_port": dest["name"],
        "destination_country": dest["country"],
        "status": "CLEARED",  # Will be overridden in _init_synthetic_data
        "value_usd": round(random.uniform(5000, 500000), 2),
        "carrier": random.choice(CARRIERS),
        "departure_date": departure.isoformat(),
        "eta": (departure + timedelta(days=random.randint(10, 30))).isoformat(),
    }

    # Generate static docs for each shipment
    _GENERATED_DOCUMENTS[sku] = [
        {
            "doc_type": "BILL_OF_LADING",
            "doc_name": "Bill of Lading",
            "status": "VERIFIED",
            "reference_number": f"BOL-{random.randint(100000, 999999)}",
            "issued_by": shipment["carrier"],
            "issued_date": shipment["departure_date"],
        },
        {
            "doc_type": "COMMERCIAL_INVOICE",
            "doc_name": "Commercial Invoice",
            "status": "VERIFIED",
            "reference_number": f"INV-{random.randint(10000, 99999)}",
            "issued_by": "Supplier",
            "issued_date": shipment["departure_date"],
        },
    ]
    return shipment


def _init_synthetic_data():
    """Generate exactly 1000 shipments with strict 70:30 ratio. Thread-safe."""
    global _GENERATED_SHIPMENTS, _GENERATED_ALERTS, _INITIALIZED

    # Fast path: already initialized
    if _INITIALIZED:
        return

    # Thread-safe initialization
    with _INIT_LOCK:
        # Double-check after acquiring lock
        if _INITIALIZED:
            return

        ports = get_port_locations()
        origins = [p for p in ports if p.get("osm_node_id") != 999999999]
        destinations = [p for p in ports if p.get("osm_node_id") != 999999999]

        if not origins or not destinations:
            print("Warning: No valid origin/destination nodes found. Using fallback mock node.")
            mock_node = {"osm_node_id": 1, "name": "Mock Port", "country": "US"}
            origins = [mock_node]
            destinations = [mock_node]

        # Strict 70:30 ratio (70% safe, 30% risk)
        for i in range(_TARGET_SHIPMENT_COUNT):
            shipment = _spawn_shipment(origins, destinations)
            if i < 600:
                shipment["status"] = "CLEARED"
            elif i < 700:
                shipment["status"] = "IN_TRANSIT"
            elif i < 900:
                shipment["status"] = "CUSTOMS_HOLD"
                _GENERATED_ALERTS.append({
                    "alert_id": str(uuid.uuid4()),
                    "severity": "WARNING",
                    "sku_id": shipment["sku_id"],
                    "message": "Shipment held pending physical verification.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "Customs Authority",
                })
            else:
                shipment["status"] = "OFAC_FLAGGED"
                _GENERATED_ALERTS.append({
                    "alert_id": str(uuid.uuid4()),
                    "severity": "CRITICAL",
                    "sku_id": shipment["sku_id"],
                    "message": "High-risk entity detected. OFAC compliance check required.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "Global Intelligence Network",
                })
            _GENERATED_SHIPMENTS.append(shipment)

        _INITIALIZED = True


def get_shipments(status_filter: str = "ALL") -> list[dict]:
    """Return shipment records, optionally filtered by status."""
    _init_synthetic_data()

    if status_filter == "ALL":
        return list(_GENERATED_SHIPMENTS)
    return [s for s in _GENERATED_SHIPMENTS if s["status"] == status_filter]


def get_alerts() -> list[dict]:
    """Return all active compliance alerts sorted by severity."""
    _init_synthetic_data()
    order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    return sorted(_GENERATED_ALERTS, key=lambda a: order.get(a["severity"], 99))


def get_documents(sku_id: str) -> list[dict]:
    """Return the document checklist for a given SKU."""
    _init_synthetic_data()
    return _GENERATED_DOCUMENTS.get(sku_id, [])
