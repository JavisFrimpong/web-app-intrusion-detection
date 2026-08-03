from flask import Blueprint, request, jsonify

prediction_bp = Blueprint(
    "prediction",
    __name__
)


@prediction_bp.route("/predict", methods=["POST"])
def predict():

    data = request.json

    return jsonify({
        "received_data": data,
        "message": "Prediction endpoint working"
    })