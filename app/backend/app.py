import os
from flask import Flask, jsonify
from flask_cors import CORS
from routes.monitor import monitor_bp
from routes.prediction import prediction_bp
from routes.status import status_bp
from routes.history import history_bp
from routes.auth import auth_bp
from routes.sensor import sensor_bp
from routes.websites import websites_bp
from utils.database import initialize_database


app = Flask(__name__)

# Allow the deployed Vercel dashboard and local development clients.
frontend_origin = (os.environ.get("FRONTEND_ORIGIN") or "").strip()
allowed_origins = [
    "https://web-app-intrusion-detection.vercel.app",
    r"https://web-app-intrusion-detection-[a-z0-9-]+-javis-frimpongs-projects\.vercel\.app",
    r"https://web-app-intrusion-detection-git-[a-z0-9-]+-javis-frimpongs-projects\.vercel\.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_origin and frontend_origin not in allowed_origins:
    allowed_origins.append(frontend_origin)

CORS(
    app,
    supports_credentials=False,
    origins=allowed_origins,
    allow_headers=["Content-Type", "Authorization", "X-Aegis-Sensor-Token"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)

# Initialize the persistent database schema at startup.
initialize_database()

# Register API routes
app.register_blueprint(prediction_bp, url_prefix="/api")
app.register_blueprint(status_bp, url_prefix="/api")
app.register_blueprint(history_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(monitor_bp, url_prefix="/api")
app.register_blueprint(sensor_bp, url_prefix="/api")
app.register_blueprint(websites_bp, url_prefix="/api")


@app.route("/")
def home():
    return jsonify({
        "message": "AEGIS IDS Backend API is running",
        "model": "Random Forest",
        "status": "active",
        "inference_mode": "windows-sensor",
        "database": "PostgreSQL" if os.environ.get("DATABASE_URL") else "SQLite",
    })


if __name__ == "__main__":
    app.run(debug=True)
