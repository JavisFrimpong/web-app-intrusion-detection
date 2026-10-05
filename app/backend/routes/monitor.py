import socket
from flask import Blueprint, jsonify, request

from routes.sensor import get_sensor_state, queue_sensor_command
from routes.auth import require_authenticated_user

monitor_bp = Blueprint("monitor", __name__)


def _resolve_target(raw_target):
    target = raw_target.strip()
    for prefix in ("https://", "http://"):
        if target.startswith(prefix):
            target = target[len(prefix):]
    target = target.split("/")[0].split(":")[0]
    return target, socket.gethostbyname(target)


@monitor_bp.route("/monitor/status", methods=["GET"])
def monitor_status():
    user, error = require_authenticated_user()
    if error:
        return error

    state = get_sensor_state(user["id"])
    return jsonify({
        "running": bool(state.get("online") and state.get("running")),
        "sensor_online": bool(state.get("online")),
        "sensor_id": state.get("sensor_id"),
        "sensor_hostname": state.get("hostname"),
        "sensor_platform": state.get("platform"),
        "interfaces": state.get("interfaces") or [],
        "started_at": state.get("started_at"),
        "uptime_seconds": state.get("uptime_seconds"),
        "target": state.get("target"),
        "target_ip": state.get("target_ip"),
        "last_seen": state.get("last_seen_iso"),
    })


@monitor_bp.route("/monitor/start", methods=["POST"])
def monitor_start():
    user, error = require_authenticated_user()
    if error:
        return error

    state = get_sensor_state(user["id"])
    if not state.get("online"):
        return jsonify({
            "success": False,
            "error": "Your AEGIS Sensor is offline. Start the Windows/Npcap sensor for this account first."
        }), 503

    data = request.get_json(silent=True) or {}
    raw_target = (data.get("target") or "").strip()
    if not raw_target:
        return jsonify({"success": False, "error": "A website/domain/IP target is required."}), 400

    try:
        clean_target, target_ip = _resolve_target(raw_target)
    except socket.gaierror:
        return jsonify({
            "success": False,
            "error": f"Couldn't resolve '{raw_target}'. Check the address and try again."
        }), 400

    command_id = queue_sensor_command(user["id"], "start", raw_target)
    return jsonify({
        "success": True,
        "message": "Start command sent to your AEGIS Sensor.",
        "command_id": command_id,
        "target": clean_target,
        "target_ip": target_ip,
    })


@monitor_bp.route("/monitor/stop", methods=["POST"])
def monitor_stop():
    user, error = require_authenticated_user()
    if error:
        return error

    state = get_sensor_state(user["id"])
    if not state.get("online"):
        return jsonify({
            "success": False,
            "error": "Your AEGIS Sensor is offline, so a stop command cannot be delivered."
        }), 503

    command_id = queue_sensor_command(user["id"], "stop")
    return jsonify({
        "success": True,
        "message": "Stop command sent to your AEGIS Sensor.",
        "command_id": command_id,
    })
