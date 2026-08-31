from flask import Flask, jsonify
from flask_cors import CORS
from routes.monitor import monitor_bp
from utils.model_loader import load_model
from routes.prediction import prediction_bp
from routes.status import status_bp
from routes.history import history_bp
from routes.live_scanner import live_scanner_bp


app = Flask(__name__)

# Allow frontend communication
CORS(app)


# Load machine learning model
model = load_model()


# Register API routes
app.register_blueprint(
    prediction_bp,
    url_prefix="/api"
)

app.register_blueprint(
    status_bp,
    url_prefix="/api"
)

app.register_blueprint(
    history_bp,
    url_prefix="/api"
)

app.register_blueprint(
    live_scanner_bp,
    url_prefix="/api"
)
app.register_blueprint(
    monitor_bp,
    url_prefix="/api"
)


@app.route("/")
def home():

    return jsonify({

        "message": "IDS Backend API is running",

        "model": "Random Forest Loaded",

        "status": "active"

    })


if __name__ == "__main__":

    app.run(
        debug=True
    )