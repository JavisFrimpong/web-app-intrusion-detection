from flask import Flask, jsonify

from prediction_store import (
    get_latest_prediction,
    get_prediction_history
)


app = Flask(__name__)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "running",
        "service": "ML Intrusion Detection System"
    })


# ============================================================
# TEST PREDICTION API
# ============================================================

@app.route("/api/test-prediction", methods=["GET"])
def test_prediction():

    return jsonify({
        "message": "Prediction API is ready."
    })


# ============================================================
# GET LATEST PREDICTION
# ============================================================

@app.route("/api/latest", methods=["GET"])
def latest_prediction():

    prediction = get_latest_prediction()

    if prediction is None:

        return jsonify({
            "message": "No predictions have been recorded yet."
        }), 404

    return jsonify(prediction)


# ============================================================
# GET PREDICTION HISTORY
# ============================================================

@app.route("/api/history", methods=["GET"])
def prediction_history():

    history = get_prediction_history()

    return jsonify({
        "count": len(history),
        "predictions": history
    })


# ============================================================
# START API SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )