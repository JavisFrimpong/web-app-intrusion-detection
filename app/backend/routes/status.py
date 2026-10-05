from flask import Blueprint, jsonify
from utils.model_loader import get_model_status

status_bp = Blueprint("status", __name__)


@status_bp.route("/status", methods=["GET"])
def status():
    model_status = get_model_status()
    ready = model_status["ready"]

    return jsonify({
        "model": "Random Forest",
        "system": "Intrusion Detection System",
        "status": "active" if ready else "degraded",
        "ml_ready": ready,
        "message": (
            "AEGIS ML engine is ready."
            if ready
            else "Backend is running, but trained ML assets are missing or unavailable."
        ),
        "model_error": model_status["error"],
    })
