from datetime import datetime
from flask import Blueprint, jsonify, request

from routes.auth import require_authenticated_user
from utils.database import get_db
from utils.ml_engine import predict_features, model_status

prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    status = model_status()
    if not status["ready"]:
        return jsonify({
            "success": False,
            "error": "Hosted Random Forest model is not ready.",
            "ml_status": status,
        }), 503

    data = request.get_json(silent=True) or {}
    features = data.get("features")
    website_id = data.get("website_id")

    try:
        result = predict_features(features)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc), "ml_status": model_status()}), 503

    db = get_db()
    try:
        destination_ip = data.get("destination_ip") or "web-application"
        destination_port = int(data.get("destination_port") or 443)
        source_ip = data.get("source_ip") or "unknown"
        source_port = int(data.get("source_port") or 0)
        packet_count = int(data.get("packet_count") or 0)
        now = data.get("timestamp") or datetime.utcnow().isoformat()

        if website_id is not None:
            site = db.execute(
                "SELECT * FROM monitored_websites WHERE id = ? AND user_id = ?",
                (website_id, user["id"]),
            ).fetchone()
            if not site:
                return jsonify({"success": False, "error": "Website not found for this account."}), 404
            destination_ip = site["domain"]

        db.execute(
            """
            INSERT INTO predictions (
                user_id, prediction, attack_type, confidence, timestamp,
                source_ip, source_port, destination_ip, destination_port, packet_count, event_source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"], result["prediction"], result["attack_type"], result["confidence"], now,
                source_ip, source_port, destination_ip, destination_port, packet_count, "Manual Prediction",
            ),
        )
        db.commit()
    finally:
        db.close()

    return jsonify({
        "success": True,
        **result,
        "engine": "Random Forest",
        "feature_count": 78,
    })
