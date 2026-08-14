from flask import Flask, jsonify

from predictor import predict_flow


app = Flask(__name__)


@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "running",
        "service": "ML Intrusion Detection System"
    })


@app.route("/api/test-prediction", methods=["GET"])
def test_prediction():

    return jsonify({
        "message": "Prediction API is ready."
    })


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
