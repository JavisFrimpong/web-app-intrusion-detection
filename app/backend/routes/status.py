from flask import Blueprint, jsonify
from utils.ml_engine import model_status, predict_features, FEATURES

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


@status_bp.route("/model/self-test", methods=["GET"])
def model_self_test():
    """
    Non-persistent health check for the deployed ML engine.
    Uses a neutral standardized 78-feature vector and does not write
    anything to prediction history.
    """
    ml = model_status()
    if not ml["ready"]:
        return jsonify({
            "success": False,
            "error": "Random Forest engine is not ready.",
            "ml_status": ml,
        }), 503

    features = {name: 0.0 for name in FEATURES}
    result = predict_features(features)

    return jsonify({
        "success": True,
        "engine": "Random Forest",
        "tree_count": ml.get("tree_count", 0),
        "feature_count": 78,
        "diagnostic_input": "neutral-standardized-vector",
        "prediction": result["prediction"],
        "attack_type": result["attack_type"],
        "confidence": result["confidence"],
        "stored": False,
    })
