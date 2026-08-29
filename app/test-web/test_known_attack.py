import joblib
import pandas as pd

model = joblib.load(r"../../models/random_forest.pkl")
scaler = joblib.load(r"../../models/standard_scaler.pkl")

# Load your processed test data (adjust path to wherever you saved X_test/y_test)
X_test = pd.read_csv(r"../../data/processed/X_test.csv")
y_test = pd.read_csv(r"../../data/processed/y_test.csv")

# Grab a row that's NOT benign
attack_indices = y_test[y_test.iloc[:, 0] != 0].index  # adjust 0 if BENIGN isn't label 0
if len(attack_indices) == 0:
    print("No attack rows found — check your label encoding")
else:
    idx = attack_indices[0]
    row = X_test.loc[[idx]]
    true_label = y_test.loc[idx]

    scaled = scaler.transform(row)
    scaled_df = pd.DataFrame(scaled, columns=row.columns)

    pred = model.predict(scaled_df)[0]
    proba = model.predict_proba(scaled_df)[0]

    print("True label:", true_label.values)
    print("Predicted:", pred)
    print("Confidence:", max(proba) * 100)