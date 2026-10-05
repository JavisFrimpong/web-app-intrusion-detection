import os
import pandas as pd


LABEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../data/processed/label_mapping.csv")
)


def load_label_mapping():
    if not os.path.exists(LABEL_PATH):
        print(f"[AEGIS] WARNING: Label mapping not found: {LABEL_PATH}")
        return {}

    try:
        mapping = pd.read_csv(LABEL_PATH)
        return dict(zip(mapping["Encoded_Label"], mapping["Original_Label"]))
    except Exception as exc:
        print(f"[AEGIS] WARNING: Could not load label mapping: {exc}")
        return {}
