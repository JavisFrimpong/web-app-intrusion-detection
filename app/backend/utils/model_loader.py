import os
import joblib


MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../models/random_forest.pkl")
)

_model = None
_model_error = None


def load_model():
    """Load the trained model once.

    Returns None when the model asset is unavailable instead of crashing
    the entire Flask application at import time.
    """
    global _model, _model_error

    if _model is not None:
        return _model

    if not os.path.exists(MODEL_PATH):
        _model_error = f"Model file not found: {MODEL_PATH}"
        print(f"[AEGIS] WARNING: {_model_error}")
        return None

    try:
        _model = joblib.load(MODEL_PATH)
        _model_error = None
        return _model
    except Exception as exc:
        _model_error = f"Could not load model: {exc}"
        print(f"[AEGIS] WARNING: {_model_error}")
        return None


def get_model_status():
    model = load_model()
    return {
        "ready": model is not None,
        "path": MODEL_PATH,
        "error": _model_error,
    }
