import joblib
import pandas as pd
import numpy as np

model = joblib.load(r"models/random_forest.pkl")
scaler = joblib.load(r"models/standard_scaler.pkl")

X_test = pd.read_csv(r"data/processed/X_test.csv")
y_test = pd.read_csv(r"data/processed/y_test.csv").squeeze()

# Scale using the SAME scaler the model was trained with
X_test_scaled = pd.DataFrame(
    scaler.transform(X_test),
    columns=X_test.columns
)

print("=" * 70)
print("TESTING ONE ROW PER ATTACK CLASS")
print("=" * 70)

for label in sorted(y_test.unique()):

    indices = y_test[y_test == label].index

    if len(indices) == 0:
        continue

    idx = indices[0]
    row = X_test_scaled.loc[[idx]]

    pred = model.predict(row)[0]
    proba = model.predict_proba(row)[0]
    confidence = max(proba) * 100

    match = "OK" if pred == label else "MISMATCH"

    print(
        f"True label: {label:>2}  |  "
        f"Predicted: {pred:>2}  |  "
        f"Confidence: {confidence:5.1f}%  |  "
        f"{match}"
    )

print()
print("=" * 70)
print("FULL TEST SET PREDICTION DISTRIBUTION")
print("=" * 70)

full_preds = model.predict(X_test_scaled)

print("\nPredicted distribution:")
print(pd.Series(full_preds).value_counts().sort_index())

non_benign = np.sum(full_preds != 0)
print(f"\nNon-BENIGN predictions: {non_benign}/{len(full_preds)}")