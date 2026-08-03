from flask import Blueprint, request, jsonify

from utils.model_loader import load_model
from utils.preprocessing import preprocess_input
from utils.label_mapper import load_label_mapping


prediction_bp = Blueprint(
    "prediction",
    __name__
)


# Load model once
model = load_model()

# Load label mapping once
label_mapping = load_label_mapping()


@prediction_bp.route("/predict", methods=["POST"])
def predict():

    try:

        # Receive JSON data
        data = request.json


        # Prepare input
        processed_data = preprocess_input(data)


        # Prediction
        prediction = model.predict(processed_data)


        # Prediction probability
        probabilities = model.predict_proba(processed_data)

        confidence = max(probabilities[0])


        # Convert prediction number to attack name
        prediction_label = int(prediction[0])

        attack_type = label_mapping.get(
            prediction_label,
            "Unknown"
        )


        return jsonify({

            "prediction": prediction_label,

            "attack_type": attack_type,

            "confidence": round(float(confidence) * 100, 2)

        })


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 400