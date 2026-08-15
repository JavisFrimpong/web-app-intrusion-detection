import os
import joblib
import pandas as pd


# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "../../models/random_forest.pkl")
)

SCALER_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "../../models/standard_scaler.pkl")
)

LABEL_MAPPING_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "../../data/processed/label_mapping.csv")
)


# ------------------------------------------------------------
# Load trained components
# ------------------------------------------------------------

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

label_mapping = pd.read_csv(LABEL_MAPPING_PATH)

label_mapping_dict = dict(
    zip(
        label_mapping["Encoded_Label"],
        label_mapping["Original_Label"]
    )
)


print("Random Forest loaded.")
print("Scaler loaded.")
print("Model features:", model.n_features_in_)
print("Scaler features:", scaler.n_features_in_)


# ------------------------------------------------------------
# Prediction function
# ------------------------------------------------------------

def predict_flow(features):

    # Convert feature dictionary to DataFrame
    feature_df = pd.DataFrame([features])

    # Make sure exactly 78 features are present
    if feature_df.shape[1] != 78:
        raise ValueError(
            f"Expected 78 features, got {feature_df.shape[1]}"
        )

    # --------------------------------------------------------
    # Ensure feature order matches the training order
    # --------------------------------------------------------

    if hasattr(model, "feature_names_in_"):
        feature_df = feature_df[
            list(model.feature_names_in_)
        ]

    # --------------------------------------------------------
    # Scale using the SAME scaler used during training
    # --------------------------------------------------------

    scaled_features = scaler.transform(feature_df)

    # --------------------------------------------------------
    # Convert scaled data back to DataFrame
    # with the original feature names
    # --------------------------------------------------------

    scaled_features_df = pd.DataFrame(
        scaled_features,
        columns=feature_df.columns
    )

    # --------------------------------------------------------
    # Make prediction
    # --------------------------------------------------------

    prediction = model.predict(
        scaled_features_df
    )[0]

    # --------------------------------------------------------
    # Get prediction probabilities
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        scaled_features_df
    )[0]

    confidence = float(
        max(probabilities) * 100
    )

    # --------------------------------------------------------
    # Convert encoded label to attack name
    # --------------------------------------------------------

    attack_type = label_mapping_dict.get(
        int(prediction),
        f"Unknown ({prediction})"
    )

    return {
        "prediction": int(prediction),
        "attack_type": attack_type,
        "confidence": round(confidence, 2)
    }

