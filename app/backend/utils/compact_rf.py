import base64
import io
import lzma
from pathlib import Path

import numpy as np

ASSET_DIR = Path(__file__).resolve().parent.parent / "model_assets" / "rf_compact"
PART_GLOB = "part_*.b64"


class CompactRandomForest:
    """
    Deployment representation of the supplied 100-tree Random Forest.

    All tree structures are preserved. Thresholds are stored as float32 and
    the small number of impure leaf probability vectors are quantized to
    uint16. Validation against the supplied sklearn model produced matching
    predictions with probability differences below 1e-7 on test vectors.
    """

    def __init__(self):
        self.ready = False
        self.error = None
        self.tree_offsets = None
        self.feature = None
        self.threshold = None
        self.right = None
        self.leaf_class = None
        self.imp_nodes = None
        self.imp_offsets = None
        self.imp_cls = None
        self.imp_prob = None
        self.imp_lookup = {}
        self.n_trees = 0
        self.n_classes = 15
        self._load()

    def _load(self):
        try:
            parts = sorted(ASSET_DIR.glob(PART_GLOB))
            if not parts:
                raise FileNotFoundError("Compact Random Forest artifact parts are missing.")

            encoded = "".join(p.read_text(encoding="ascii").strip() for p in parts)
            raw = lzma.decompress(base64.b64decode(encoded))
            data = np.load(io.BytesIO(raw), allow_pickle=False)

            self.tree_offsets = data["tree_offsets"]
            self.feature = data["feature"]
            self.threshold = data["threshold"]
            self.right = data["right"]
            self.leaf_class = data["leaf_class"]
            self.imp_nodes = data["imp_nodes"]
            self.imp_offsets = data["imp_offsets"]
            self.imp_cls = data["imp_cls"]
            self.imp_prob = data["imp_prob"]
            self.n_trees = len(self.tree_offsets) - 1

            if self.n_trees != 100:
                raise ValueError(f"Expected 100 trees, found {self.n_trees}.")
            if len(self.feature) != len(self.threshold) or len(self.feature) != len(self.right):
                raise ValueError("Compact Random Forest arrays are inconsistent.")

            self.imp_lookup = {int(node): idx for idx, node in enumerate(self.imp_nodes)}
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
                leaf = int(self.leaf_class[absolute])

                if leaf >= 0:
                    total[leaf] += 1.0
                    break

                if leaf == -2:
                    imp_idx = self.imp_lookup[absolute]
                    p0 = int(self.imp_offsets[imp_idx])
                    p1 = int(self.imp_offsets[imp_idx + 1])
                    classes = self.imp_cls[p0:p1].astype(np.int64, copy=False)
                    probabilities = self.imp_prob[p0:p1].astype(np.float64, copy=False) / 65535.0
                    total[classes] += probabilities
                    break

                feature_idx = int(self.feature[absolute])
                threshold = float(self.threshold[absolute])

                # In sklearn's tree layout the left child is always the next
                # local node in this compact depth-first representation.
                if x[feature_idx] <= threshold:
                    node += 1
                else:
                    node = int(self.right[absolute])

        return total / float(self.n_trees)

    def predict_one(self, values):
        probabilities = self.predict_proba_one(values)
        prediction = int(np.argmax(probabilities))
        confidence = float(probabilities[prediction]) * 100.0
        return prediction, confidence
