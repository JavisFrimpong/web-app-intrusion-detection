from flask import Flask, jsonify
from flask_cors import CORS

from utils.model_loader import load_model
from routes.prediction import prediction_bp


app = Flask(__name__)

CORS(app)


model = load_model()


app.register_blueprint(
    prediction_bp,
    url_prefix="/api"
)


@app.route("/")
def home():
    return jsonify({
        "message": "IDS Backend API is running",
        "model": "Random Forest Loaded"
    })


if __name__ == "__main__":
    app.run(debug=True)