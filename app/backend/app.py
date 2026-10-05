import os
from flask import Flask, jsonify
from flask_cors import CORS
from routes.monitor import monitor_bp
from routes.prediction import prediction_bp
from routes.status import status_bp
from routes.history import history_bp
from routes.live_scanner import live_scanner_bp
from routes.auth import auth_bp
from routes.sensor import sensor_bp
from utils.database import initialize_database


app = Flask(__name__)

# Allow the deployed Vercel dashboard and local development clients.
frontend_origin = (os.environ.get("FRONTEND_ORIGIN") or "").strip()
allowed_origins = [
    "https://web-app-intrusion-detection.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_origin and frontend_origin not in allowed_origins:
    allowed_origins.append(frontend_origin)

CORS(
    app,
    supports_credentials=True,
    origins=allowed_origins,
)

# Try loading the model at startup. Missing assets no longer crash Flask.
initialize_database()

model = load_model()

# Register API routes
app.register_blueprint(prediction_bp, url_prefix="/api")
app.register_blueprint(status_bp, url_prefix="/api")
app.register_blueprint(history_bp, url_prefix="/api")
app.register_blueprint(live_scanner_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(monitor_bp, url_prefix="/api")
app.register_blueprint(sensor_bp, url_prefix="/api")


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
