import joblib

model = joblib.load(r"../../models/random_forest.pkl")

importances = sorted(
    zip(model.feature_names_in_, model.feature_importances_),
    key=lambda x: -x[1]
)

for name, score in importances[:15]:
    print(f"{name}: {score:.4f}")