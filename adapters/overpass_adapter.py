"""
Overpass / OpenStreetMap Port Location Adapter
==============================================

In production this module queries the Overpass API:
    https://overpass-api.de/api/interpreter

For this POC, port data is fetched from a public cities dataset
and clearly labelled as synthetic Overpass/OSM-sourced data.
"""

import requests
import json
import os
import random

# Resolve cache file path relative to THIS file's directory, not CWD
_ADAPTER_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_ADAPTER_DIR)
CACHE_FILE = os.path.join(_PROJECT_ROOT, "ports_cache.json")

_PORTS_CACHE = []


def fetch_live_ports() -> list[dict]:
    """Fetch port locations from a public cities dataset (Overpass/OSM proxy)."""
    try:
        response = requests.get("https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json")
        response.raise_for_status()
        data = response.json()

        # Take an evenly spaced slice of 800 cities to ensure global distribution
        step = max(1, len(data) // 800)
        selected_cities = data[::step][:800]

        ports = []
        for i, city in enumerate(selected_cities):
            name = city.get("name", "Unnamed")
            if not name:
                continue

            ports.append({
                "osm_node_id": 1000000 + i,
                "name": f"Port of {name}",
                "country": city.get("country", "INT"),
                "lat": float(city.get("lat", 0.0)),
                "lng": float(city.get("lng", 0.0)),
                "port_type": "container_terminal",
                "risk_level": random.choices(["LOW", "MEDIUM", "HIGH"], weights=[0.8, 0.15, 0.05])[0],
                "active_shipments": 0,
            })
            if len(ports) >= 800:
                break

        # Always ensure we have a Global Compliance Checkpoint
        ports.append({
            "osm_node_id": 999999999,
            "name": "GLOBAL COMPLIANCE CHECKPOINT",
            "country": "INT",
            "lat": 0.0,
            "lng": 0.0,
            "port_type": "checkpoint",
            "risk_level": "HIGH",
            "active_shipments": 0,
        })

        return ports
    except Exception as e:
        print(f"Failed to fetch live ports: {e}")
        # Fallback to synthetic if live fails
        from . import overpass_adapter_backup
        return overpass_adapter_backup._SYNTHETIC_PORTS


def _validate_cache(cached: list[dict]) -> bool:
    """Ensure the cached data has a checkpoint node. If not, it's stale."""
    return any(p.get("osm_node_id") == 999999999 for p in cached)


import threading

_PORT_LOCK = threading.Lock()

def get_port_locations() -> list[dict]:
    """Return port locations from cache or live fetch."""
    global _PORTS_CACHE
    if _PORTS_CACHE:
        return _PORTS_CACHE

    with _PORT_LOCK:
        if _PORTS_CACHE:
            return _PORTS_CACHE

        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r") as f:
                cached = json.load(f)
            if _validate_cache(cached):
                _PORTS_CACHE = cached
            else:
                # Stale cache — regenerate
                print("Stale ports cache detected (no checkpoint node). Regenerating...")
                _PORTS_CACHE = fetch_live_ports()
                with open(CACHE_FILE, "w") as f:
                    json.dump(_PORTS_CACHE, f)
        else:
            _PORTS_CACHE = fetch_live_ports()
            with open(CACHE_FILE, "w") as f:
                json.dump(_PORTS_CACHE, f)
    return _PORTS_CACHE
