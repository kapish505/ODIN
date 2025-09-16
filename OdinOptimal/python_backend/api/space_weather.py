"""
Space Weather API Endpoints (historical dataset ingest and queries)
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from typing import Any, Dict, List, Optional
import requests

from database import db
from models.space_weather import SpaceWeather
from services.space_weather import SpaceWeatherService

space_weather_bp = Blueprint("space_weather", __name__)


def _parse_iso_date(value: str) -> datetime:
  try:
    return datetime.fromisoformat(value)
  except Exception:
    # Accept YYYY-MM-DD
    return datetime.strptime(value, "%Y-%m-%d")


@space_weather_bp.route("/ingest", methods=["POST"])
def ingest_space_weather():
  """Ingest the provided historical space weather dataset into the DB.
  Body: { "url": "https://.../space_weather_data.json" }
  Stores major_events as rows in SpaceWeather with timestamp and solar_events JSON.
  """
  try:
    payload = request.get_json(force=True) or {}
    url = (payload.get("url") or "").strip()
    if not url:
      return jsonify({"success": False, "error": "Missing url"}), 400

    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data: Dict[str, Any] = r.json()

    major_events: List[Dict[str, Any]] = data.get("major_events") or []
    if not isinstance(major_events, list):
      return jsonify({"success": False, "error": "major_events is not a list"}), 400

    rows: List[SpaceWeather] = []
    for ev in major_events:
      date_str: Optional[str] = ev.get("date") or ev.get("timestamp")
      if not date_str:
        continue
      try:
        ts = _parse_iso_date(date_str)
      except Exception:
        continue
      # Map severity to an approximate radiation_level (arbitrary but consistent)
      sev = (ev.get("severity") or "").upper()
      rad = {"LOW": 0.05, "MODERATE": 0.15, "MEDIUM": 0.15, "HIGH": 0.35, "CRITICAL": 0.6}.get(sev, None)
      row = SpaceWeather(
        timestamp=ts,
        solar_flux=None,
        geomagnetic_index=None,
        solar_events=ev,  # store full event payload
        radiation_level=rad,
      )
      rows.append(row)

    if rows:
      db.session.bulk_save_objects(rows)
      db.session.commit()

    # Return some context from metadata if present
    meta = data.get("metadata") or {}
    return jsonify({
      "success": True,
      "ingested_events": len(rows),
      "dataset": {
        "name": meta.get("dataset_name"),
        "time_range": meta.get("time_range"),
        "parameters": meta.get("parameters"),
      },
    })
  except Exception as e:
    db.session.rollback()
    return jsonify({"success": False, "error": str(e)}), 400


@space_weather_bp.route("/events", methods=["GET"])
def list_events():
  """List ingested major space-weather events from the DB.
  Query params: start=YYYY-MM-DD (or ISO), end=YYYY-MM-DD (or ISO), limit=int
  """
  try:
    start_str = request.args.get("start")
    end_str = request.args.get("end")
    limit = int(request.args.get("limit", 200))

    q = SpaceWeather.query
    if start_str:
      q = q.filter(SpaceWeather.timestamp >= _parse_iso_date(start_str))
    if end_str:
      q = q.filter(SpaceWeather.timestamp <= _parse_iso_date(end_str))
    q = q.order_by(SpaceWeather.timestamp.asc()).limit(limit)

    rows = q.all()
    return jsonify({
      "success": True,
      "count": len(rows),
      "events": [r.to_dict() for r in rows],
    })
  except Exception as e:
    return jsonify({"success": False, "error": str(e)}), 400


@space_weather_bp.route("/current", methods=["GET"])
def current_space_weather():
  """Return current space weather using service (simulated if no live feed)."""
  try:
    svc = SpaceWeatherService()
    current = svc.get_current_solar_activity()
    return jsonify({"success": True, **current})
  except Exception as e:
    return jsonify({"success": False, "error": str(e)}), 400
