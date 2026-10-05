from flask import Blueprint, jsonify

status_bp = Blueprint("status", __name__)


@status_bp.route("/status", methods=["GET"])
def status():
    return jsonify({
        "model": "Random Forest",
        "system": "Intrusion Detection System",
        "status": "active",
        "api_ready": True,
        "ml_ready": True,
        "inference_mode": "windows-sensor",
        "message": "AEGIS API is ready. Random Forest inference runs on each account's Windows/Npcap sensor.",
    })
