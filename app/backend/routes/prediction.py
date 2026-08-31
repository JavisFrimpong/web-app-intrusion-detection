import time
from collections import defaultdict, deque
from flask import Blueprint, request, jsonify

from utils.model_loader import load_model
from utils.preprocessing import preprocess_input
from utils.label_mapper import load_label_mapping

prediction_bp = Blueprint("prediction", __name__)

# Load model and label mapping
model = load_model()
label_mapping = load_label_mapping()

# Flow Capture Constants from traffic-monitor/flow_capture.py
CONFIDENCE_THRESHOLD = 70.0
LOW_SUPPORT_CLASSES = {8, 13}
RATE_WINDOW_SECONDS = 5
PORTSCAN_DISTINCT_PORT_THRESHOLD = 15
DDOS_FLOW_COUNT_THRESHOLD = 20

# In-memory activity tracker for rate-based heuristics
_source_activity = defaultdict(deque)


def record_flow_activity(source_ip, dest_port, now_ts):
    activity = _source_activity[source_ip]
    activity.append((now_ts, dest_port))
    cutoff = now_ts - RATE_WINDOW_SECONDS
    while activity and activity[0][0] < cutoff:
        activity.popleft()
    return activity


def check_heuristics(source_ip, activity):
    alerts = []
    distinct_ports = {entry[1] for entry in activity if entry[1] is not None}
    if len(distinct_ports) >= PORTSCAN_DISTINCT_PORT_THRESHOLD:
        alerts.append("PORTSCAN")

    if len(activity) >= DDOS_FLOW_COUNT_THRESHOLD:
        alerts.append("DDoS/FLOOD")

    return alerts


def interpret_prediction(prediction_int, confidence_pct):
    if confidence_pct < CONFIDENCE_THRESHOLD:
        return "UNCERTAIN"
    elif prediction_int in LOW_SUPPORT_CLASSES:
        return "LOW-SUPPORT CLASS (verify manually)"
    else:
        return "CONFIDENT"


@prediction_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json or {}
        source_ip = request.remote_addr or data.get("source_ip", "127.0.0.1")
        dest_port = data.get("Destination_Port") or data.get("dst_port") or 80

        # Preprocess with StandardScaler transform & exact 78 features
        processed_data = preprocess_input(data)

        # Model inference
        prediction = model.predict(processed_data)
        probabilities = model.predict_proba(processed_data)

        confidence_pct = round(float(max(probabilities[0])) * 100, 2)
        prediction_label = int(prediction[0])

        attack_type = label_mapping.get(prediction_label, "BENIGN" if prediction_label == 0 else "Unknown")
        trust_status = interpret_prediction(prediction_label, confidence_pct)

        # Rate-based heuristics check
        activity = record_flow_activity(source_ip, dest_port, time.time())
        heuristic_alerts = check_heuristics(source_ip, activity)

        if heuristic_alerts:
            attack_type = f"{', '.join(heuristic_alerts)} (heuristic-confirmed pattern)"

        return jsonify({
            "prediction": prediction_label,
            "attack_type": attack_type,
            "confidence": confidence_pct,
            "trust_status": trust_status,
            "heuristic_alerts": heuristic_alerts
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400