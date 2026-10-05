from flask import Flask, jsonify
from flask_cors import CORS
from routes.monitor import monitor_bp
from utils.model_loader import load_model, get_model_status
from routes.prediction import prediction_bp
from routes.status import status_bp
from routes.history import history_bp
from routes.live_scanner import live_scanner_bp
from routes.auth import auth_bp
from routes.sensor import sensor_bp


app = Flask(__name__)

# Allow the local Vite/React console to communicate with Flask.
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

# Try loading the model at startup. Missing assets no longer crash Flask.
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
    model_status = get_model_status()
    return jsonify({
        "message": "IDS Backend API is running",
        "model": "Random Forest",
        "ml_ready": model_status["ready"],
        "status": "active" if model_status["ready"] else "degraded",
        "model_error": model_status["error"],
    })


if __name__ == "__main__":
    app.run(debug=True)
