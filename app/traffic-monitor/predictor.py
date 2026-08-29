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

    # --------------------------------------------------------
    # Convert feature dictionary to DataFrame
    # --------------------------------------------------------

    feature_df = pd.DataFrame([features])

    # --------------------------------------------------------
    # Model feature names
    # --------------------------------------------------------

    if not hasattr(model, "feature_names_in_"):

        raise RuntimeError(
            "The loaded Random Forest does not contain "
            "training feature names."
        )

    expected_features = list(
        model.feature_names_in_
    )

    # --------------------------------------------------------
    # Verify feature count
    # --------------------------------------------------------

    if len(expected_features) != 78:

        raise RuntimeError(
            f"Model expects {len(expected_features)} "
            "features instead of 78."
        )

    # --------------------------------------------------------
    # Check missing features
    # --------------------------------------------------------

    missing_features = [
        feature
        for feature in expected_features
        if feature not in feature_df.columns
    ]

    if missing_features:

        raise ValueError(
            "Missing model features: "
            + ", ".join(missing_features)
        )

    # --------------------------------------------------------
    # Check unexpected features
    # --------------------------------------------------------

    unexpected_features = [
        feature
        for feature in feature_df.columns
        if feature not in expected_features
    ]

    if unexpected_features:

        raise ValueError(
            "Unexpected features: "
            + ", ".join(unexpected_features)
        )

    # --------------------------------------------------------
    # EXACT TRAINING FEATURE ORDER
    # --------------------------------------------------------

    feature_df = feature_df[
        expected_features
    ]

    # --------------------------------------------------------
    # Scale using training scaler
    # --------------------------------------------------------

    scaled_features = scaler.transform(
        feature_df
    )

    # --------------------------------------------------------
    # Restore feature names after scaling
    # --------------------------------------------------------

    scaled_features_df = pd.DataFrame(
        scaled_features,
        columns=expected_features
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = model.predict(
        scaled_features_df
    )[0]

    # --------------------------------------------------------
    # Prediction probability
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        scaled_features_df
    )[0]

    confidence = (
        float(max(probabilities)) * 100
    )

    # --------------------------------------------------------
    # Attack name
    # --------------------------------------------------------

    attack_type = label_mapping_dict.get(
        int(prediction),
        f"Unknown ({prediction})"
    )

    return {
        "prediction": int(prediction),
        "attack_type": attack_type,
        "confidence": round(
            confidence,
            2
        )
    }