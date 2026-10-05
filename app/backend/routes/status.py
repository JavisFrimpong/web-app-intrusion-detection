from flask import Blueprint, jsonify
from utils.ml_engine import model_status

status_bp = Blueprint("status", __name__)


@status_bp.route("/status", methods=["GET"])
def status():
    ml = model_status()
    return jsonify({
        "model": "Random Forest",
        "system": "Machine Learning-Based Web Application Intrusion Detection System",
        "status": "active",
        "api_ready": True,
        "ml_ready": bool(ml["ready"]),
        "inference_mode": "hosted-random-forest",
        "feature_count": ml.get("feature_count", 0),
        "tree_count": ml.get("tree_count", 0),
        "model_artifact": ml.get("artifact"),
        "message": (
            "AEGIS hosted Random Forest inference is ready."
            if ml["ready"]
            else "AEGIS API is online, but trained model artifacts must be installed before ML predictions can run."
        ),
    })
