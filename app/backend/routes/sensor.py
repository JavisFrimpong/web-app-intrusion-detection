import threading
import time
from datetime import datetime

from flask import Blueprint, jsonify, request

from routes.history import get_db_connection
from utils.database import get_db

sensor_bp = Blueprint("sensor", __name__)

_lock = threading.Lock()
_states = {}


def _new_state():
    return {
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


def _sensor_user():
    token = request.headers.get("X-Aegis-Sensor-Token", "").strip()
    if not token:
        return None

    db = get_db()
    user = db.execute(
        "SELECT id, email FROM users WHERE sensor_token = ? LIMIT 1",
        (token,),
    ).fetchone()
    db.close()
    return user


def _require_sensor_user():
    user = _sensor_user()
    if not user:
        return None, (jsonify({"success": False, "error": "Invalid or missing sensor credential."}), 401)
    return user, None


def _state_for(user_id):
    uid = int(user_id)
    with _lock:
        if uid not in _states:
            _states[uid] = _new_state()
        return _states[uid]


def get_sensor_state(user_id):
    uid = int(user_id)
    with _lock:
        state = _states.setdefault(uid, _new_state())
        if state["last_seen"]:
            state["online"] = (time.time() - state["last_seen"]) < 15
        else:
            state["online"] = False
        snapshot = dict(state)

    if snapshot["started_at"] and snapshot["running"]:
        snapshot["uptime_seconds"] = max(0, int(time.time() - snapshot["started_at"]))
    else:
        snapshot["uptime_seconds"] = None

    snapshot["last_seen_iso"] = (
        datetime.fromtimestamp(snapshot["last_seen"]).isoformat()
        if snapshot["last_seen"] else None
    )
    return snapshot


def queue_sensor_command(user_id, command, target=None):
    uid = int(user_id)
    with _lock:
        state = _states.setdefault(uid, _new_state())
        state["command_id"] += 1
        state["command"] = command
        state["command_target"] = target
        return state["command_id"]


@sensor_bp.route("/sensor/status", methods=["GET"])
def sensor_status():
    user, error = _require_sensor_user()
    if error:
        return error
    return jsonify({"success": True, **get_sensor_state(user["id"])})


@sensor_bp.route("/sensor/heartbeat", methods=["POST"])
def sensor_heartbeat():
    user, error = _require_sensor_user()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    uid = int(user["id"])

    with _lock:
        state = _states.setdefault(uid, _new_state())
        state["online"] = True
        state["last_seen"] = time.time()
        state["sensor_id"] = data.get("sensor_id") or state["sensor_id"]
        state["hostname"] = data.get("hostname") or state["hostname"]
        state["platform"] = data.get("platform") or state["platform"]
        state["interfaces"] = data.get("interfaces") or state["interfaces"]
        state["running"] = bool(data.get("running", False))
        state["target"] = data.get("target")
        state["target_ip"] = data.get("target_ip")

        if state["running"] and not state["started_at"]:
            state["started_at"] = time.time()
        elif not state["running"]:
            state["started_at"] = None

    return jsonify({"success": True, "user_id": uid})


@sensor_bp.route("/sensor/command", methods=["GET"])
def sensor_command():
    user, error = _require_sensor_user()
    if error:
        return error

    try:
        after = int(request.args.get("after", 0))
    except (TypeError, ValueError):
        after = 0

    uid = int(user["id"])
    with _lock:
        state = _states.setdefault(uid, _new_state())
        if state["command_id"] <= after:
            return jsonify({
                "success": True,
                "command": None,
                "command_id": state["command_id"],
            })

        return jsonify({
            "success": True,
            "command_id": state["command_id"],
            "command": state["command"],
            "target": state["command_target"],
            "user_id": uid,
        })


@sensor_bp.route("/sensor/classify", methods=["POST"])
def sensor_classify():
    user, error = _require_sensor_user()
    if error:
        return error

    return jsonify({
        "success": False,
        "error": "Hosted classification is disabled in production. The authenticated Windows sensor performs Random Forest inference locally and uploads only the resulting telemetry."
    }), 503


@sensor_bp.route("/sensor/result", methods=["POST"])
def sensor_result():
    user, error = _require_sensor_user()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    required = ["prediction", "attack_type", "confidence", "source_ip", "destination_ip"]
    missing = [key for key in required if key not in data]
    if missing:
        return jsonify({"success": False, "error": "Missing fields: " + ", ".join(missing)}), 400

    timestamp = data.get("timestamp") or datetime.now().isoformat()
    uid = int(user["id"])

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO predictions (
                user_id, prediction, attack_type, confidence, timestamp,
                source_ip, source_port, destination_ip, destination_port, packet_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
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
                INSERT INTO heuristic_alerts (
                    user_id, alert_type, message, timestamp, source_ip
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    uid,
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
