from datetime import datetime
from collections import defaultdict
from flask import Blueprint, jsonify, request

from routes.auth import require_authenticated_user
from utils.database import get_db

history_bp = Blueprint("history", __name__)

def get_db_connection():
    return get_db()


@history_bp.route("/history", methods=["GET"])
def get_history():
    user, error = require_authenticated_user()
    if error:
        return error

    limit = max(1, min(request.args.get("limit", default=50, type=int), 500))
    try:
        conn = get_db_connection()
        predictions = conn.execute(
            "SELECT * FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user["id"], limit),
        ).fetchall()
        alerts = conn.execute(
            "SELECT * FROM heuristic_alerts WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user["id"], limit),
        ).fetchall()
        conn.close()

        formatted_history = []
        for row in predictions:
            pred_val = row["prediction"]
            raw_attack = str(row["attack_type"] or "")
            dest_port = row["destination_port"] or 80

            if pred_val == 0 or "BENIGN" in raw_attack.upper():
                display_attack = "BENIGN"
                status_label = "Clean"
            elif "Heartbleed" in raw_attack and dest_port in (80, 443, 5000, 8080, 8000):
                display_attack = "BENIGN"
                status_label = "Clean"
            else:
                display_attack = raw_attack or "Anomaly"
                status_label = "Detected"

            upper_attack = display_attack.upper()
            if display_attack == "BENIGN":
                severity = "Normal"
            elif "HEARTBLEED" in upper_attack or "INFILTRATION" in upper_attack or "SQL" in upper_attack or "DDOS" in upper_attack:
                severity = "Critical"
            elif "XSS" in upper_attack or "BRUTE" in upper_attack or "BOT" in upper_attack or "DOS" in upper_attack:
                severity = "High"
            elif "PORTSCAN" in upper_attack or "SCAN" in upper_attack:
                severity = "Medium"
            else:
                severity = "High" if pred_val != 0 else "Normal"

            formatted_history.append({
                "id": f"DET-{row['id']}",
                "timestamp": row["timestamp"],
                "sourceIp": row["source_ip"] or "127.0.0.1",
                "destIp": row["destination_ip"] or "127.0.0.1",
                "destPort": dest_port,
                "attackType": display_attack,
                "prediction": pred_val,
                "confidence": row["confidence"] or 0,
                "protocol": "TCP",
                "status": status_label,
                "severity": severity,
                "eventSource": row["event_source"] or "Legacy Record",
            })

        formatted_alerts = [{
            "id": f"ALT-{row['id']}",
            "alertType": row["alert_type"],
            "message": row["message"],
            "timestamp": row["timestamp"],
            "sourceIp": row["source_ip"],
        } for row in alerts]

        return jsonify({"success": True, "history": formatted_history, "alerts": formatted_alerts})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@history_bp.route("/stats", methods=["GET"])
def get_stats():
    user, error = require_authenticated_user()
    if error:
        return error

    try:
        conn = get_db_connection()
        uid = user["id"]
        total_count = conn.execute(
            "SELECT COUNT(*) AS count FROM predictions WHERE user_id = ?", (uid,)
        ).fetchone()["count"]
        benign_count = conn.execute(
            "SELECT COUNT(*) AS count FROM predictions WHERE user_id = ? AND prediction = 0", (uid,)
        ).fetchone()["count"]
        threat_count = conn.execute(
            "SELECT COUNT(*) AS count FROM predictions WHERE user_id = ? AND prediction != 0", (uid,)
        ).fetchone()["count"]
        alerts_count = conn.execute(
            "SELECT COUNT(*) AS count FROM heuristic_alerts WHERE user_id = ?", (uid,)
        ).fetchone()["count"]
        rows = conn.execute(
            "SELECT prediction, attack_type, timestamp FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT 2000",
            (uid,),
        ).fetchall()
        conn.close()

        dist_counts = defaultdict(int)
        for row in rows:
            lbl = row["attack_type"] or ""
            upper = lbl.upper()
            if "BENIGN" in upper:
                dist_counts["BENIGN"] += 1
            elif "PORTSCAN" in upper or "PORT_SCAN" in upper:
                dist_counts["PortScan"] += 1
            elif "DOS" in upper or "DDOS" in upper or "FLOOD" in upper:
                dist_counts["DoS / DDoS"] += 1
            elif "SQL" in upper or "INJECTION" in upper or "WEB" in upper:
                dist_counts["Web Attack (SQLi)"] += 1
            elif "BRUTE" in upper or "FORCE" in upper:
                dist_counts["Brute Force"] += 1
            elif "BOTNET" in upper:
                dist_counts["Botnet"] += 1
            else:
                dist_counts["BENIGN" if row["prediction"] == 0 else "Other"] += 1

        color_map = {
            "BENIGN": "#10b981",
            "DoS / DDoS": "#ef4444",
            "PortScan": "#f59e0b",
            "Web Attack (SQLi)": "#f43f5e",
            "Brute Force": "#a855f7",
            "Botnet": "#06b6d4",
            "Other": "#64748b",
        }
        attack_distribution = [
            {"name": name, "value": dist_counts[name], "color": color}
            for name, color in color_map.items()
        ]

        threat_categories = [
            {"category": "DoS / DDoS", "count": dist_counts["DoS / DDoS"], "riskScore": 95},
            {"category": "PortScan", "count": dist_counts["PortScan"], "riskScore": 65},
            {"category": "SQL Injection", "count": dist_counts["Web Attack (SQLi)"], "riskScore": 90},
            {"category": "SSH BruteForce", "count": dist_counts["Brute Force"], "riskScore": 78},
            {"category": "Botnet C2", "count": dist_counts["Botnet"], "riskScore": 88},
        ]

        timeline_map = defaultdict(lambda: {"benign": 0, "attacks": 0, "total": 0})
        for row in reversed(rows):
            try:
                ts_clean = row["timestamp"].split(".")[0]
                fmt = "%Y-%m-%dT%H:%M:%S" if "T" in ts_clean else "%Y-%m-%d %H:%M:%S"
                time_str = datetime.strptime(ts_clean, fmt).strftime("%H:%M")
                is_attack = row["prediction"] != 0
                timeline_map[time_str]["attacks" if is_attack else "benign"] += 1
                timeline_map[time_str]["total"] += 1
            except Exception:
                continue

        sorted_times = sorted(timeline_map.keys())[-8:]
        traffic_timeline = [{"time": t, **timeline_map[t]} for t in sorted_times]
        if not traffic_timeline:
            traffic_timeline = [{
                "time": datetime.now().strftime("%H:%M"),
                "benign": 0,
                "attacks": 0,
                "total": 0,
            }]

        return jsonify({
            "success": True,
            "metrics": {
                "totalCount": total_count,
                "benignCount": benign_count,
                "threatCount": threat_count,
                "alertsCount": alerts_count,
            },
            "attackDistribution": attack_distribution,
            "threatCategories": threat_categories,
            "trafficTimeline": traffic_timeline,
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@history_bp.route("/history/clear", methods=["POST"])
def clear_history():
    user, error = require_authenticated_user()
    if error:
        return error

    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM predictions WHERE user_id = ?", (user["id"],))
        conn.execute("DELETE FROM heuristic_alerts WHERE user_id = ?", (user["id"],))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Your detection records were cleared."})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500
