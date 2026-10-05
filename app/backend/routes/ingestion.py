from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from utils.database import get_db
from utils.ml_engine import predict_features, model_status

ingestion_bp = Blueprint("ingestion", __name__)


@ingestion_bp.route("/ingest/flow/<site_key>", methods=["POST", "OPTIONS"])
@cross_origin(origins="*")
def ingest_flow(site_key):
    """
    Receive one CICFlowMeter/CICIDS2017-compatible 78-feature flow from an
    approved traffic source, run the hosted Random Forest, and store the
    resulting detection for the website owner's dashboard.
    """
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    ml = model_status()
    if not ml["ready"]:
        return jsonify({
            "success": False,
            "error": "Hosted Random Forest model is not ready.",
            "ml_status": ml,
        }), 503

    db = get_db()
    try:
        site = db.execute(
            "SELECT * FROM monitored_websites WHERE site_key = ? LIMIT 1",
            (site_key,),
        ).fetchone()
        if not site:
            return jsonify({"success": False, "error": "Unknown website key."}), 404

        payload = request.get_json(silent=True) or {}
        features = payload.get("features")

        try:
            result = predict_features(features)
        except ValueError as exc:
            return jsonify({"success": False, "error": str(exc)}), 400
        except RuntimeError as exc:
            return jsonify({"success": False, "error": str(exc)}), 503

        now = payload.get("timestamp") or datetime.utcnow().isoformat()
        source_ip = payload.get("source_ip") or (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.remote_addr
            or "unknown"
        )
        source_port = int(payload.get("source_port") or 0)
        destination_port = int(payload.get("destination_port") or features.get("Destination Port") or 443)
        packet_count = int(
            payload.get("packet_count")
            or (features.get("Total Fwd Packets", 0) + features.get("Total Backward Packets", 0))
            or 0
        )

        db.execute(
            """
            INSERT INTO predictions (
                user_id, prediction, attack_type, confidence, timestamp,
                source_ip, source_port, destination_ip, destination_port, packet_count
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                site["user_id"], result["prediction"], result["attack_type"],
                result["confidence"], now, source_ip, source_port,
                site["domain"], destination_port, packet_count,
            ),
        )

        if result["prediction"] != 0:
            db.execute(
                """
                INSERT INTO heuristic_alerts (user_id, alert_type, message, timestamp, source_ip)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    site["user_id"],
                    result["attack_type"],
                    f"ML detection on {site['domain']}: {result['attack_type']} ({result['confidence']}% confidence)",
                    now,
                    source_ip,
                ),
            )

        db.execute(
            "UPDATE monitored_websites SET last_event_at = ?, status = 'monitoring' WHERE id = ?",
            (now, site["id"]),
        )
        db.commit()

        return jsonify({
            "success": True,
            **result,
            "engine": "Random Forest",
            "website": site["domain"],
            "feature_count": 78,
        })
    finally:
        db.close()
