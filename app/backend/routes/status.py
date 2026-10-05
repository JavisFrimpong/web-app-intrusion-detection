from flask import Blueprint, jsonify
from utils.model_loader import get_model_status

status_bp = Blueprint("status", __name__)


@status_bp.route("/status", methods=["GET"])
def status():
    model_status = get_model_status()

    return jsonify({
        "model": "Random Forest",
        "system": "Intrusion Detection System",
        "status": "active",
        "api_ready": True,
        "ml_ready": model_status["ready"],
        "inference_mode": "hosted-api" if model_status["ready"] else "windows-sensor",
        "message": (
            "AEGIS API and hosted ML engine are ready."
            if model_status["ready"]
            else "AEGIS API is ready. Live Random Forest inference runs on the connected Windows/Npcap sensor."
        ),
        "model_error": model_status["error"],
    })
