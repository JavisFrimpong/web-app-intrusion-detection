import os
import threading
import time
from datetime import datetime

from flask import Blueprint, jsonify, request

from routes.history import get_db_connection
from utils.label_mapper import load_label_mapping
from utils.model_loader import load_model
from utils.preprocessing import preprocess_input

sensor_bp = Blueprint("sensor", __name__)

_model = load_model()
_labels = load_label_mapping()
_lock = threading.Lock()

_state = {
    "online": False,
    "sensor_id": None,
    "last_seen": 0.0,
    "hostname": None,
    "platform": None,
    "interfaces": [],
    "running": False,
    "target": None,
    "target_ip": None,
    "started_at": None,
    "command_id": 0,
    "command": "idle",
    "command_target": None,
}


def _authorized():
    configured = (os.environ.get("AEGIS_SENSOR_TOKEN") or "").strip()
    if not configured:
        return True
    return request.headers.get("X-Aegis-Sensor-Token", "") == configured


def _require_sensor_auth():
    if not _authorized():
        return jsonify({"success": False, "error": "Invalid sensor token."}), 401
    return None


def _refresh_online_locked():
    if _state["last_seen"]:
        _state["online"] = (time.time() - _state["last_seen"]) < 15
    else:
        _state["online"] = False


def get_sensor_state():
    with _lock:
        _refresh_online_locked()
        snapshot = dict(_state)
    if snapshot["started_at"] and snapshot["running"]:
        snapshot["uptime_seconds"] = max(0, int(time.time() - snapshot["started_at"]))
    else:
        snapshot["uptime_seconds"] = None
    snapshot["last_seen_iso"] = (
        datetime.fromtimestamp(snapshot["last_seen"]).isoformat()
        if snapshot["last_seen"] else None
    )
    return snapshot


def queue_sensor_command(command, target=None):
    with _lock:
        _state["command_id"] += 1
        _state["command"] = command
        _state["command_target"] = target
        command_id = _state["command_id"]
    return command_id


@sensor_bp.route("/sensor/status", methods=["GET"])
def sensor_status():
    return jsonify({"success": True, **get_sensor_state()})


@sensor_bp.route("/sensor/heartbeat", methods=["POST"])
def sensor_heartbeat():
    auth_error = _require_sensor_auth()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    with _lock:
        _state["online"] = True
        _state["last_seen"] = time.time()
        _state["sensor_id"] = data.get("sensor_id") or _state["sensor_id"]
        _state["hostname"] = data.get("hostname") or _state["hostname"]
        _state["platform"] = data.get("platform") or _state["platform"]
        _state["interfaces"] = data.get("interfaces") or _state["interfaces"]
        _state["running"] = bool(data.get("running", False))
        _state["target"] = data.get("target")
        _state["target_ip"] = data.get("target_ip")
        if _state["running"] and not _state["started_at"]:
            _state["started_at"] = time.time()
        elif not _state["running"]:
            _state["started_at"] = None

    return jsonify({"success": True})


@sensor_bp.route("/sensor/command", methods=["GET"])
def sensor_command():
    auth_error = _require_sensor_auth()
    if auth_error:
        return auth_error

    try:
        after = int(request.args.get("after", 0))
    except (TypeError, ValueError):
        after = 0

    with _lock:
        if _state["command_id"] <= after:
            return jsonify({"success": True, "command": None, "command_id": _state["command_id"]})
        return jsonify({
            "success": True,
            "command_id": _state["command_id"],
            "command": _state["command"],
            "target": _state["command_target"],
        })


@sensor_bp.route("/sensor/classify", methods=["POST"])
def sensor_classify():
    auth_error = _require_sensor_auth()
    if auth_error:
        return auth_error

    if _model is None:
        return jsonify({"success": False, "error": "Random Forest model is not available on the API server."}), 503

    data = request.get_json(silent=True) or {}
    features = data.get("features")
    if not isinstance(features, dict) or not features:
        return jsonify({"success": False, "error": "A feature dictionary is required."}), 400

    try:
        processed = preprocess_input(features)
        prediction = int(_model.predict(processed)[0])
        probabilities = _model.predict_proba(processed)[0]
        confidence = round(float(max(probabilities)) * 100.0, 2)
        attack_type = _labels.get(prediction, "BENIGN" if prediction == 0 else f"Unknown ({prediction})")
        return jsonify({
            "success": True,
            "prediction": prediction,
            "attack_type": attack_type,
            "confidence": confidence,
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@sensor_bp.route("/sensor/result", methods=["POST"])
def sensor_result():
    auth_error = _require_sensor_auth()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    required = ["prediction", "attack_type", "confidence", "source_ip", "destination_ip"]
    missing = [key for key in required if key not in data]
    if missing:
        return jsonify({"success": False, "error": "Missing fields: " + ", ".join(missing)}), 400

    timestamp = data.get("timestamp") or datetime.now().isoformat()

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO predictions (
                prediction, attack_type, confidence, timestamp,
                source_ip, source_port, destination_ip, destination_port, packet_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(data["prediction"]),
                str(data["attack_type"]),
                float(data["confidence"]),
                timestamp,
                str(data["source_ip"]),
                int(data.get("source_port") or 0),
                str(data["destination_ip"]),
                int(data.get("destination_port") or 0),
                int(data.get("packet_count") or 0),
            ),
        )

        for alert in data.get("alerts") or []:
            cur.execute(
                """
                INSERT INTO heuristic_alerts (alert_type, message, timestamp, source_ip)
                VALUES (?, ?, ?, ?)
                """,
                (
                    str(alert.get("type") or "HEURISTIC"),
                    str(alert.get("message") or ""),
                    timestamp,
                    str(data["source_ip"]),
                ),
            )

        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500
