from flask import Blueprint, jsonify

prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/predict", methods=["POST"])
def predict():
    return jsonify({
        "success": False,
        "error": (
            "Hosted prediction is disabled in the production architecture. "
            "Run the authenticated Windows/Npcap AEGIS sensor, which performs "
            "Random Forest inference locally and uploads the resulting detection telemetry."
        )
    }), 503
