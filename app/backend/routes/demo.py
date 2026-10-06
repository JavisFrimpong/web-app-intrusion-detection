from datetime import datetime
from flask import Blueprint, jsonify, request

from routes.auth import require_authenticated_user
from utils.database import get_db
from utils.ml_engine import predict_features, model_status

demo_bp = Blueprint("demo", __name__)

# Genuine standardized CICIDS2017 feature row preserved in the project's
# test notebook (STEP 31 output). The notebook loaded X_train with one row
# before printing the 78 feature values, so this sample is in the exact
# standardized feature space used by the trained Random Forest.
CICIDS_SAMPLE = {
    "Destination Port": -0.454139,
    "Flow Duration": -0.470183,
    "Total Fwd Packets": -0.010413,
    "Total Backward Packets": -0.009081,
    "Total Length of Fwd Packets": -0.083648,
    "Total Length of Bwd Packets": -0.007580,
    "Fwd Packet Length Max": -0.262428,
    "Fwd Packet Length Min": 0.226321,
    "Fwd Packet Length Mean": -0.156043,
    "Fwd Packet Length Std": -0.260715,
    "Bwd Packet Length Max": -0.430782,
    "Bwd Packet Length Min": 0.759052,
    "Bwd Packet Length Mean": -0.385244,
    "Bwd Packet Length Std": -0.427394,
    "Flow Bytes/s": -0.052803,
    "Flow Packets/s": -0.232582,
    "Flow IAT Mean": -0.306199,
    "Flow IAT Std": -0.385584,
    "Flow IAT Max": -0.399878,
    "Flow IAT Min": -0.056754,
    "Fwd IAT Total": -0.462266,
    "Fwd IAT Mean": -0.291428,
    "Fwd IAT Std": -0.361724,
    "Fwd IAT Max": -0.393717,
    "Fwd IAT Min": -0.125518,
    "Bwd IAT Total": -0.367570,
    "Bwd IAT Mean": -0.215801,
    "Bwd IAT Std": -0.251512,
    "Bwd IAT Max": -0.290570,
    "Bwd IAT Min": -0.123549,
    "Fwd PSH Flags": -0.226002,
    "Bwd PSH Flags": 0.0,
    "Fwd URG Flags": -0.005807,
    "Bwd URG Flags": 0.0,
    "Fwd Header Length": 0.001706,
    "Bwd Header Length": 0.001613,
    "Fwd Packets/s": -0.211011,
    "Bwd Packets/s": -0.169073,
    "Min Packet Length": 0.628682,
    "Max Packet Length": -0.455675,
    "Packet Length Mean": -0.414882,
    "Packet Length Std": -0.446593,
    "Packet Length Variance": -0.313486,
    "FIN Flag Count": -0.182065,
    "SYN Flag Count": -0.226002,
    "RST Flag Count": -0.016637,
    "PSH Flag Count": -0.651161,
    "ACK Flag Count": -0.673035,
    "URG Flag Count": -0.335870,
    "CWE Flag Count": -0.005807,
    "ECE Flag Count": -0.016681,
    "Down/Up Ratio": 0.429244,
    "Average Packet Size": -0.402917,
    "Avg Fwd Segment Size": -0.156043,
    "Avg Bwd Segment Size": -0.385244,
    "Fwd Header Length.1": 0.001706,
    "Fwd Avg Bytes/Bulk": 0.0,
    "Fwd Avg Packets/Bulk": 0.0,
    "Fwd Avg Bulk Rate": 0.0,
    "Bwd Avg Bytes/Bulk": 0.0,
    "Bwd Avg Packets/Bulk": 0.0,
    "Bwd Avg Bulk Rate": 0.0,
    "Subflow Fwd Packets": -0.010413,
    "Subflow Fwd Bytes": -0.083648,
    "Subflow Bwd Packets": -0.009081,
    "Subflow Bwd Bytes": -0.007580,
    "Init_Win_bytes_forward": -0.497989,
    "Init_Win_bytes_backward": -0.249889,
    "act_data_pkt_fwd": -0.007423,
    "min_seg_size_forward": 0.002575,
    "Active Mean": -0.135369,
    "Active Std": -0.110854,
    "Active Max": -0.159110,
    "Active Min": -0.109241,
    "Idle Mean": -0.375838,
    "Idle Std": -0.115877,
    "Idle Max": -0.381176,
    "Idle Min": -0.361859,
}


@demo_bp.route("/demo/cicids-sample", methods=["POST", "OPTIONS"])
def run_cicids_demo_sample():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    ml = model_status()
    if not ml["ready"]:
        return jsonify({
            "success": False,
            "error": "Random Forest engine is not ready.",
            "ml_status": ml,
        }), 503

    result = predict_features(CICIDS_SAMPLE)
    now = datetime.utcnow().isoformat()

    # Use the real requester IP for the verification event. On a hosted
    # deployment this is normally the public IP visible to Render (or the
    # first trusted proxy-forwarded address), not the PC's private LAN IP.
    forwarded_for = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    requester_ip = forwarded_for or request.remote_addr or "unknown"

    db = get_db()
    try:
        data = request.get_json(silent=True) or {}
        website_id = data.get("website_id")

        if website_id is not None:
            site = db.execute(
                "SELECT * FROM monitored_websites WHERE id = ? AND user_id = ?",
                (website_id, user["id"]),
            ).fetchone()
            if not site:
                return jsonify({"success": False, "error": "Website not found for this account."}), 404
        else:
            site = db.execute(
                "SELECT * FROM monitored_websites WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                (user["id"],),
            ).fetchone()

        destination = site["domain"] if site else "CICIDS2017 verification sample"

        db.execute(
            """
            INSERT INTO predictions (
                user_id, prediction, attack_type, confidence, timestamp,
                source_ip, source_port, destination_ip, destination_port, packet_count, event_source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                result["prediction"],
                result["attack_type"],
                result["confidence"],
                now,
                requester_ip,
                0,
                destination,
                0,
                1,
                "CICIDS2017 Verification",
            ),
        )
        if site:
            db.execute(
                "UPDATE monitored_websites SET last_event_at = ?, status = 'monitoring' WHERE id = ?",
                (now, site["id"]),
            )
        db.commit()
    finally:
        db.close()

    return jsonify({
        "success": True,
        "sample": "CICIDS2017 standardized verification flow",
        "stored": True,
        "engine": "Random Forest",
        "tree_count": ml.get("tree_count", 100),
        "feature_count": 78,
        "website": destination,
        "monitoring_state": "active" if site else "verification-only",
        "source_ip": requester_ip,
        **result,
    })
