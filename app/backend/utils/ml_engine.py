import os
from pathlib import Path

import joblib
import pandas as pd

from utils.compact_rf import CompactRandomForest

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = os.environ.get("AEGIS_MODEL_PATH") or str(BASE_DIR / "models" / "random_forest.pkl")
SCALER_PATH = os.environ.get("AEGIS_SCALER_PATH") or str(BASE_DIR / "models" / "standard_scaler.pkl")
LABEL_MAPPING_PATH = os.environ.get("AEGIS_LABEL_MAPPING_PATH") or str(
    Path(__file__).resolve().parent.parent / "model_assets" / "label_mapping.csv"
)

FEATURES = [
    "Destination Port","Flow Duration","Total Fwd Packets","Total Backward Packets",
    "Total Length of Fwd Packets","Total Length of Bwd Packets","Fwd Packet Length Max",
    "Fwd Packet Length Min","Fwd Packet Length Mean","Fwd Packet Length Std",
    "Bwd Packet Length Max","Bwd Packet Length Min","Bwd Packet Length Mean",
    "Bwd Packet Length Std","Flow Bytes/s","Flow Packets/s","Flow IAT Mean",
    "Flow IAT Std","Flow IAT Max","Flow IAT Min","Fwd IAT Total","Fwd IAT Mean",
    "Fwd IAT Std","Fwd IAT Max","Fwd IAT Min","Bwd IAT Total","Bwd IAT Mean",
    "Bwd IAT Std","Bwd IAT Max","Bwd IAT Min","Fwd PSH Flags","Bwd PSH Flags",
    "Fwd URG Flags","Bwd URG Flags","Fwd Header Length","Bwd Header Length",
    "Fwd Packets/s","Bwd Packets/s","Min Packet Length","Max Packet Length",
    "Packet Length Mean","Packet Length Std","Packet Length Variance","FIN Flag Count",
    "SYN Flag Count","RST Flag Count","PSH Flag Count","ACK Flag Count","URG Flag Count",
    "CWE Flag Count","ECE Flag Count","Down/Up Ratio","Average Packet Size",
    "Avg Fwd Segment Size","Avg Bwd Segment Size","Fwd Header Length.1",
    "Fwd Avg Bytes/Bulk","Fwd Avg Packets/Bulk","Fwd Avg Bulk Rate","Bwd Avg Bytes/Bulk",
    "Bwd Avg Packets/Bulk","Bwd Avg Bulk Rate","Subflow Fwd Packets","Subflow Fwd Bytes",
    "Subflow Bwd Packets","Subflow Bwd Bytes","Init_Win_bytes_forward",
    "Init_Win_bytes_backward","act_data_pkt_fwd","min_seg_size_forward","Active Mean",
    "Active Std","Active Max","Active Min","Idle Mean","Idle Std","Idle Max","Idle Min"
]

_labels = None
_load_error = None
_compact = CompactRandomForest()
_pickle_model = None
_scaler = None


def _load_labels():
    global _labels, _load_error
    if _labels is not None:
        return
    try:
        mapping = pd.read_csv(LABEL_MAPPING_PATH)
        _labels = dict(zip(mapping["Encoded_Label"].astype(int), mapping["Original_Label"]))
    except Exception as exc:
        _load_error = str(exc)


def _load_pickle_fallback():
    global _pickle_model, _scaler
    if _pickle_model is not None:
        return
    if os.path.exists(MODEL_PATH):
        _pickle_model = joblib.load(MODEL_PATH)
        if os.path.exists(SCALER_PATH):
            _scaler = joblib.load(SCALER_PATH)


def model_status():
    _load_labels()
    try:
        _load_pickle_fallback()
    except Exception:
        pass

    ready = bool(_labels) and (_compact.ready or _pickle_model is not None)
    return {
        "ready": ready,
        "error": None if ready else (_compact.error or _load_error or "Model artifact unavailable"),
        "feature_count": 78,
        "tree_count": 100 if _compact.ready else (
            len(getattr(_pickle_model, "estimators_", [])) if _pickle_model is not None else 0
        ),
        "engine": "Random Forest",
        "input_space": "standardized-cicids2017",
        "artifact": "compact-supplied-random-forest" if _compact.ready else "pickle",
    }


def predict_features(features):
    """
    Run the trained Random Forest.

    The supplied archive's scaler is an identity scaler because it was saved
    after the training CSV had already been standardized. For that reason the
    hosted endpoint expects the 78 CICIDS2017 feature values in the same
    standardized feature space used during model training.
    """
    _load_labels()

    if not isinstance(features, dict):
        raise ValueError("features must be an object keyed by CICIDS2017 feature name")

    missing = [name for name in FEATURES if name not in features]
    unexpected = [name for name in features if name not in FEATURES]
    if missing:
        raise ValueError("Missing model features: " + ", ".join(missing))
    if unexpected:
        raise ValueError("Unexpected features: " + ", ".join(unexpected))

    values = [float(features[name]) for name in FEATURES]

    if _compact.ready:
        prediction, confidence = _compact.predict_one(values)
    else:
        _load_pickle_fallback()
        if _pickle_model is None:
            raise RuntimeError("The trained Random Forest artifact is not installed.")
        frame = pd.DataFrame([values], columns=FEATURES)
        if _scaler is not None:
            frame = pd.DataFrame(_scaler.transform(frame), columns=FEATURES)
        prediction = int(_pickle_model.predict(frame)[0])
        probabilities = _pickle_model.predict_proba(frame)[0]
        confidence = float(max(probabilities)) * 100.0

    return {
        "prediction": int(prediction),
        "attack_type": _labels.get(int(prediction), f"Unknown ({prediction})"),
        "confidence": round(float(confidence), 2),
    }
