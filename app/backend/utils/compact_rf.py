import base64
import io
import lzma
from pathlib import Path

import numpy as np

ASSET_DIR = Path(__file__).resolve().parent.parent / "model_assets" / "rf_compact"
BINARY_ASSET = ASSET_DIR / "model.npz.xz"
PART_GLOB = "part_*.b64"


class CompactRandomForest:
    """
    Compact inference-only representation extracted from the trained
    sklearn RandomForestClassifier supplied with the project.

    The artifact stores all 100 decision trees, their split features and
    thresholds, and sparse leaf class probabilities. This avoids shipping
    the 78 MB pickle while preserving the trained forest's inference logic.
    """

    def __init__(self):
        self.ready = False
        self.error = None
        self.tree_offsets = None
        self.feature = None
        self.threshold = None
        self.left = None
        self.right = None
        self.prob_offsets = None
        self.cls = None
        self.prob = None
        self.n_trees = 0
        self.n_classes = 15
        self._load()

    def _load(self):
        try:
            if BINARY_ASSET.exists():
                packed = lzma.decompress(BINARY_ASSET.read_bytes())
            else:
                parts = sorted(ASSET_DIR.glob(PART_GLOB))
                if not parts:
                    raise FileNotFoundError("Compact Random Forest artifact is missing.")
                encoded = "".join(p.read_text(encoding="ascii").strip() for p in parts)
                packed = lzma.decompress(base64.b64decode(encoded))

            data = np.load(io.BytesIO(packed), allow_pickle=False)

            self.tree_offsets = data["tree_offsets"]
            self.feature = data["feature"]
            self.threshold = data["threshold"]
            self.left = data["left"]
            self.right = data["right"]
            self.prob_offsets = data["prob_offsets"]
            self.cls = data["cls"]
            self.prob = data["prob"]
            self.n_trees = len(self.tree_offsets) - 1

            if self.n_trees != 100:
                raise ValueError(f"Expected 100 trees, found {self.n_trees}.")
            self.ready = True
        except Exception as exc:
            self.error = str(exc)
            self.ready = False

    def predict_proba_one(self, values):
        if not self.ready:
            raise RuntimeError(self.error or "Compact Random Forest is not ready.")

        x = np.asarray(values, dtype=np.float64)
        if x.shape != (78,):
            raise ValueError(f"Expected 78 standardized features, received shape {x.shape}.")

        total = np.zeros(self.n_classes, dtype=np.float64)

        for tree_idx in range(self.n_trees):
            start = int(self.tree_offsets[tree_idx])
            node = 0

            while True:
                absolute = start + node
                left = int(self.left[absolute])
                if left == -1:
                    p0 = int(self.prob_offsets[absolute])
                    p1 = int(self.prob_offsets[absolute + 1])
                    ids = self.cls[p0:p1].astype(np.int64, copy=False)
                    probs = self.prob[p0:p1].astype(np.float64, copy=False)
                    total[ids] += probs
                    break

                feature_idx = int(self.feature[absolute])
                threshold = float(self.threshold[absolute])
                node = left if x[feature_idx] <= threshold else int(self.right[absolute])

        return total / float(self.n_trees)

    def predict_one(self, values):
        probabilities = self.predict_proba_one(values)
        prediction = int(np.argmax(probabilities))
        confidence = float(probabilities[prediction]) * 100.0
        return prediction, confidence
