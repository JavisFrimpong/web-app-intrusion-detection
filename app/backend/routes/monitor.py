import os
import sys
import signal
import socket
import subprocess
import threading
import time
from datetime import datetime
from flask import Blueprint, jsonify, request

monitor_bp = Blueprint("monitor", __name__)

# Adjust this to the actual location of flow_capture.py in your project.
CAPTURE_SCRIPT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "traffic-monitor")
)
CAPTURE_SCRIPT_PATH = os.path.join(CAPTURE_SCRIPT_DIR, "flow_capture.py")

_lock = threading.Lock()
_state = {"process": None, "started_at": None, "target_input": None, "target_ip": None}


def _is_running():
    proc = _state["process"]
    return proc is not None and proc.poll() is None


def _resolve_target(raw_target):
    """
    Clean up whatever the user typed (a bare domain, a full URL, or an
    IP) into a hostname, then resolve it to an IP address. Raises
    socket.gaierror if the name can't be resolved.
    """
    target = raw_target.strip()
    for prefix in ("https://", "http://"):
        if target.startswith(prefix):
            target = target[len(prefix):]
    target = target.split("/")[0].split(":")[0]  # drop any path or port pasted in
    return target, socket.gethostbyname(target)


@monitor_bp.route("/monitor/status", methods=["GET"])
def monitor_status():
    with _lock:
        running = _is_running()
        started_at = _state["started_at"] if running else None
        target_input = _state["target_input"] if running else None
        target_ip = _state["target_ip"] if running else None
    uptime = int(time.time() - started_at) if running and started_at else None
    return jsonify({
        "running": running,
        "started_at": datetime.fromtimestamp(started_at).isoformat() if started_at else None,
        "uptime_seconds": uptime,
        "target": target_input,
        "target_ip": target_ip,
    })


@monitor_bp.route("/monitor/start", methods=["POST"])
def monitor_start():
    data = request.get_json(silent=True) or {}
    raw_target = (data.get("target") or "").strip()

    with _lock:
        if _is_running():
            return jsonify({"success": True, "already_running": True,
                             "message": "Monitoring is already running."})

        if not os.path.exists(CAPTURE_SCRIPT_PATH):
            return jsonify({"success": False,
                             "error": f"Capture script not found at {CAPTURE_SCRIPT_PATH}"}), 500

        args = [sys.executable, CAPTURE_SCRIPT_PATH]
        target_ip = None

        if raw_target:
            try:
                _clean_target, target_ip = _resolve_target(raw_target)
            except socket.gaierror:
                return jsonify({
                    "success": False,
                    "error": f"Couldn't resolve '{raw_target}' to an address. "
                             f"Check the website address and try again."
                }), 400
            args += ["--target-ip", target_ip]

        try:
            creationflags = 0
            if os.name == "nt":
                # Required so Stop can later signal *this* process specifically
                # (CTRL_BREAK_EVENT) without also killing the Flask process.
                creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

            proc = subprocess.Popen(args, cwd=CAPTURE_SCRIPT_DIR, creationflags=creationflags)
            _state["process"] = proc
            _state["started_at"] = time.time()
            _state["target_input"] = raw_target or None
            _state["target_ip"] = target_ip
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({
        "success": True,
        "message": "Flow capture engine started.",
        "target": raw_target or None,
        "target_ip": target_ip,
    })


@monitor_bp.route("/monitor/stop", methods=["POST"])
def monitor_stop():
    with _lock:
        proc = _state["process"]
        if not _is_running():
            return jsonify({"success": True, "already_stopped": True,
                             "message": "Monitoring was not running."})
        try:
            if os.name == "nt":
                proc.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                proc.send_signal(signal.SIGINT)
        except Exception as e:
            return jsonify({"success": False, "error": f"Failed to signal process: {e}"}), 500

    try:
        proc.wait(timeout=15)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)

    with _lock:
        _state["process"] = None
        _state["started_at"] = None
        _state["target_input"] = None
        _state["target_ip"] = None

    return jsonify({"success": True, "message": "Flow capture engine stopped."})
