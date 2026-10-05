import os
import joblib
import pandas as pd

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
MODEL_PATH = os.environ.get("AEGIS_MODEL_PATH") or os.path.join(BASE_DIR, "models", "random_forest.pkl")
SCALER_PATH = os.environ.get("AEGIS_SCALER_PATH") or os.path.join(BASE_DIR, "models", "standard_scaler.pkl")
LABEL_MAPPING_PATH = os.environ.get("AEGIS_LABEL_MAPPING_PATH") or os.path.join(BASE_DIR, "data", "processed", "label_mapping.csv")

_model = None
_scaler = None
_labels = None
_load_error = None


def _load():
    global _model, _scaler, _labels, _load_error
    if _model is not None or _load_error is not None:
        return

    try:
        _model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        mapping = pd.read_csv(LABEL_MAPPING_PATH)
        _labels = dict(zip(mapping["Encoded_Label"], mapping["Original_Label"]))
    except Exception as exc:
        _load_error = str(exc)


def model_status():
    _load()
    expected = []
    if _model is not None and hasattr(_model, "feature_names_in_"):
        expected = list(_model.feature_names_in_)
    return {
        "ready": _model is not None and _scaler is not None and _labels is not None,
        "error": _load_error,
        "feature_count": len(expected),
        "model_path": MODEL_PATH,
    }


def predict_features(features):
    _load()
    if _model is None or _scaler is None or _labels is None:
        raise RuntimeError(
            "The trained Random Forest artifacts are not installed on the hosted service. "
            "Provide random_forest.pkl, standard_scaler.pkl, and label_mapping.csv."
        )

    if not isinstance(features, dict):
        raise ValueError("features must be an object keyed by CICIDS2017 feature name")

    if not hasattr(_model, "feature_names_in_"):
        raise RuntimeError("The trained Random Forest does not contain feature names.")

    expected = list(_model.feature_names_in_)
    missing = [name for name in expected if name not in features]
    unexpected = [name for name in features if name not in expected]

    if missing:
        raise ValueError("Missing model features: " + ", ".join(missing))
    if unexpected:
        raise ValueError("Unexpected features: " + ", ".join(unexpected))

    frame = pd.DataFrame([[features[name] for name in expected]], columns=expected)
    scaled = _scaler.transform(frame)
    scaled_frame = pd.DataFrame(scaled, columns=expected)

    prediction = int(_model.predict(scaled_frame)[0])
    probabilities = _model.predict_proba(scaled_frame)[0]
    confidence = float(max(probabilities)) * 100.0

    return {
        "prediction": prediction,
        "attack_type": _labels.get(prediction, f"Unknown ({prediction})"),
        "confidence": round(confidence, 2),
    }
