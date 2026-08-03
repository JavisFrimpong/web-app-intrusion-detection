import pandas as pd
import os


LABEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../../data/processed/label_mapping.csv"
)


def load_label_mapping():

    mapping = pd.read_csv(LABEL_PATH)

    label_dict = dict(
        zip(
            mapping["Encoded_Label"],
            mapping["Original_Label"]
        )
    )

    return label_dict