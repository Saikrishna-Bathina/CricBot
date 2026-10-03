"""Deterministic normalized local embedding generator matching server/src/services/embeddings/embeddingService.js."""

import hashlib
import math
import re
from typing import List

STOP_WORDS = {
    'the', 'is', 'a', 'an', 'in', 'to', 'of', 'and', 'if', 'it', 'or', 'on', 'at', 'by', 'as', 'for', 'be', 'this', 'that', 'with', 'from', 'shall'
}


def generate_local_vector(text: str, dimensions: int = 768) -> List[float]:
    """Generates a deterministic normalized embedding vector matching Node.js implementation."""
    if not text:
        return [0.0] * dimensions

    vector = [0.0] * dimensions
    normalized = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    words = [w for w in normalized.split() if w]

    if not words:
        return vector

    # 1. Hash word tokens
    for word in words:
        is_stop = word in STOP_WORDS
        weight = 0.05 if is_stop else 1.0
        h = hashlib.sha256(f"w_{word}".encode("utf-8")).digest()

        for j in range(6):
            idx = int.from_bytes(h[j * 2 : (j * 2) + 2], "big") % dimensions
            bin_sign = 1.0 if (h[j] % 2 == 0) else -1.0
            vector[idx] += bin_sign * weight * (h[j] / 255.0)

        # 2. Character 3-grams for subword matching
        if not is_stop and len(word) >= 4:
            for k in range(len(word) - 2):
                tri = word[k : k + 3]
                tri_hash = hashlib.md5(f"t_{tri}".encode("utf-8")).digest()
                tri_idx = int.from_bytes(tri_hash[0:2], "big") % dimensions
                vector[tri_idx] += 0.2

    # L2 Normalization
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        vector = [round(x / norm, 6) for x in vector]

    return vector
