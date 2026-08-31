import os
import joblib
import pandas as pd
from utils.model_loader import load_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCALER_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "../../../models/standard_scaler.pkl")
)

# Load scaler once at startup
_scaler = None
if os.path.exists(SCALER_PATH):
    try:
        _scaler = joblib.load(SCALER_PATH)
    except Exception as e:
        print(f"Warning: Could not load scaler from {SCALER_PATH}: {e}")

_model = load_model()


def preprocess_input(data):
    """
    Prepare incoming JSON data to match the exact 78 features
    and scaling used during Random Forest model training.
    Identical logic to traffic-monitor/predictor.py.
    """
    if hasattr(_model, "feature_names_in_"):
        expected_features = list(_model.feature_names_in_)
    else:
        # Fallback to column names from X_train.csv
        feature_path = os.path.abspath(
            os.path.join(BASE_DIR, "../../../data/processed/X_train.csv")
        )
        expected_features = pd.read_csv(feature_path, nrows=1).columns.tolist()

    # Convert dictionary to DataFrame
    input_df = pd.DataFrame([data])

    # Ensure all required features are present
    for feature in expected_features:
        if feature not in input_df.columns:
            input_df[feature] = 0

    # Enforce exact feature ordering
    input_df = input_df[expected_features]

    # Apply StandardScaler transform if available
    if _scaler is not None:
        try:
            scaled_array = _scaler.transform(input_df)
            scaled_df = pd.DataFrame(scaled_array, columns=expected_features)
            return scaled_df
        except Exception as err:
            print(f"Scaler transformation warning: {err}")

    return input_df