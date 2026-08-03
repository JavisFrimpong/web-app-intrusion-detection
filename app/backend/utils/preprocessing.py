import pandas as pd
import os


# Location of the scaled training data
FEATURE_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../../data/processed/X_train.csv"
)


def preprocess_input(data):
    """
    Prepare incoming JSON data
    so it matches the features used during model training.
    """

    # Load only the column names from X_train.csv
    training_features = pd.read_csv(
        FEATURE_PATH,
        nrows=1
    )

    feature_columns = training_features.columns.tolist()


    # Convert incoming JSON into dataframe
    input_data = pd.DataFrame([data])


    # Add missing features
    # (temporary values for testing)
    for feature in feature_columns:
        if feature not in input_data.columns:
            input_data[feature] = 0


    # Keep only training features
    # and maintain the same order
    input_data = input_data[feature_columns]


    return input_data