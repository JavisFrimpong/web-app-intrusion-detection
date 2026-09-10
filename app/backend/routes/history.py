import os
import sqlite3
from datetime import datetime
from collections import defaultdict
from flask import Blueprint, jsonify, request

history_bp = Blueprint("history", __name__)

# Absolute path to the SQLite database
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.abspath(os.path.join(BACKEND_DIR, "../traffic-monitor/predictions.db"))

def initialize_db_if_needed():
    """Ensure database file and tables exist before querying."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction INTEGER,
            attack_type TEXT,
            confidence REAL,
            timestamp TEXT,
            source_ip TEXT,
            source_port INTEGER,
            destination_ip TEXT,
            destination_port INTEGER,
            packet_count INTEGER
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS heuristic_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT,
            message TEXT,
            timestamp TEXT,
            source_ip TEXT
        )
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    initialize_db_if_needed()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@history_bp.route("/history", methods=["GET"])
def get_history():
    limit = request.args.get("limit", default=50, type=int)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get predictions
        cursor.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,)
        )
        predictions = cursor.fetchall()
        
        # Get heuristic alerts
        cursor.execute(
            "SELECT * FROM heuristic_alerts ORDER BY id DESC LIMIT ?", (limit,)
        )
        alerts = cursor.fetchall()
        
        conn.close()
        
        # Map predictions to expected frontend structure
        formatted_history = []
        for row in predictions:
            pred_val = row["prediction"]
            raw_attack = str(row["attack_type"] or "")
            dest_port = row["destination_port"] or 80

            # Normalize attack label for display
            if pred_val == 0 or "BENIGN" in raw_attack.upper():
                display_attack = "BENIGN"
                status_label = "Clean"
            elif "Heartbleed" in raw_attack and dest_port in (80, 443, 5000, 8080, 8000):
                display_attack = "BENIGN"
                status_label = "Clean"
            else:
                display_attack = raw_attack or "Anomaly"
                status_label = "Blocked"

            formatted_history.append({
                "id": f"DET-{row['id']}",
                "timestamp": row["timestamp"],
                "sourceIp": row["source_ip"] or "127.0.0.1",
                "destIp": row["destination_ip"] or "127.0.0.1",
                "destPort": dest_port,
                "attackType": display_attack,
                "prediction": pred_val,
                "confidence": row["confidence"] or 98.5,
                "protocol": "TCP",
                "status": status_label
            })
            
        formatted_alerts = []
        for row in alerts:
            formatted_alerts.append({
                "id": f"ALT-{row['id']}",
                "alertType": row["alert_type"],
                "message": row["message"],
                "timestamp": row["timestamp"],
                "sourceIp": row["source_ip"]
            })
            
        return jsonify({
            "success": True,
            "history": formatted_history,
            "alerts": formatted_alerts
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@history_bp.route("/stats", methods=["GET"])
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total metrics
        cursor.execute("SELECT COUNT(*) FROM predictions")
        total_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM predictions WHERE prediction = 0")
        benign_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM predictions WHERE prediction != 0")
        threat_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM heuristic_alerts")
        alerts_count = cursor.fetchone()[0]
        
        # Fetch raw classifications for pie chart & bar charts
        cursor.execute("SELECT prediction, attack_type, timestamp FROM predictions ORDER BY id DESC LIMIT 2000")
        rows = cursor.fetchall()
        conn.close()
        
        # 1. Attack Distribution
        dist_counts = defaultdict(int)
        for row in rows:
            lbl = row["attack_type"] or ""
            if "BENIGN" in lbl:
                dist_counts["BENIGN"] += 1
            elif "PORTSCAN" in lbl.upper() or "PORT_SCAN" in lbl.upper():
                dist_counts["PortScan"] += 1
            elif "DOS" in lbl.upper() or "DDOS" in lbl.upper() or "FLOOD" in lbl.upper():
                dist_counts["DoS / DDoS"] += 1
            elif "SQL" in lbl.upper() or "INJECTION" in lbl.upper() or "WEB" in lbl.upper():
                dist_counts["Web Attack (SQLi)"] += 1
            elif "BRUTE" in lbl.upper() or "FORCE" in lbl.upper():
                dist_counts["Brute Force"] += 1
            elif "BOTNET" in lbl.upper():
                dist_counts["Botnet"] += 1
            else:
                if row["prediction"] == 0:
                    dist_counts["BENIGN"] += 1
                else:
                    dist_counts["Other"] += 1
                    
        # Setup pie colors
        color_map = {
            "BENIGN": "#10b981",
            "DoS / DDoS": "#ef4444",
            "PortScan": "#f59e0b",
            "Web Attack (SQLi)": "#f43f5e",
            "Brute Force": "#a855f7",
            "Botnet": "#06b6d4",
            "Other": "#64748b"
        }
        
        attack_distribution = []
        for name, color in color_map.items():
            # Include all classes, even if 0, so the legend displays cleanly,
            # or filter if needed. Including all is standard for visual layout consistency.
            attack_distribution.append({
                "name": name,
                "value": dist_counts[name],
                "color": color
            })
            
        # 2. Threat Categories (Bar Chart counts & Risk Scores)
        threat_categories = [
            {"category": "DoS / DDoS", "count": dist_counts["DoS / DDoS"], "riskScore": 95},
            {"category": "PortScan", "count": dist_counts["PortScan"], "riskScore": 65},
            {"category": "SQL Injection", "count": dist_counts["Web Attack (SQLi)"], "riskScore": 90},
            {"category": "SSH BruteForce", "count": dist_counts["Brute Force"], "riskScore": 78},
            {"category": "Botnet C2", "count": dist_counts["Botnet"], "riskScore": 88}
        ]
        
        # 3. Traffic Timeline (grouped by minute)
        timeline_map = defaultdict(lambda: {"benign": 0, "attacks": 0, "total": 0})
        # Process chronologically
        for row in reversed(rows):
            ts = row["timestamp"]
            try:
                # Timestamps are datetime.now().isoformat() or custom formatted string
                # We handle both ISO standard and space-separated formats
                ts_clean = ts.split(".")[0] # remove milliseconds
                if "T" in ts_clean:
                    dt = datetime.strptime(ts_clean, "%Y-%m-%dT%H:%M:%S")
                else:
                    dt = datetime.strptime(ts_clean, "%Y-%m-%d %H:%M:%S")
                time_str = dt.strftime("%H:%M")
                
                is_attack = row["prediction"] != 0
                if is_attack:
                    timeline_map[time_str]["attacks"] += 1
                else:
                    timeline_map[time_str]["benign"] += 1
                timeline_map[time_str]["total"] += 1
            except Exception:
                continue
                
        # Sort and take last 8 timeline data points
        sorted_times = sorted(timeline_map.keys())[-8:]
        traffic_timeline = []
        for t in sorted_times:
            traffic_timeline.append({
                "time": t,
                "benign": timeline_map[t]["benign"],
                "attacks": timeline_map[t]["attacks"],
                "total": timeline_map[t]["total"]
            })
            
        # Fallback if empty timeline to avoid rendering issues
        if not traffic_timeline:
            now_str = datetime.now().strftime("%H:%M")
            traffic_timeline = [{"time": now_str, "benign": 0, "attacks": 0, "total": 0}]

        return jsonify({
            "success": True,
            "metrics": {
                "totalCount": total_count,
                "benignCount": benign_count,
                "threatCount": threat_count,
                "alertsCount": alerts_count
            },
            "attackDistribution": attack_distribution,
            "threatCategories": threat_categories,
            "trafficTimeline": traffic_timeline
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@history_bp.route("/history/clear", methods=["POST"])
def clear_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions")
        cursor.execute("DELETE FROM heuristic_alerts")
        conn.commit()
        conn.close()
        return jsonify({
            "success": True,
            "message": "Database records cleared successfully."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
