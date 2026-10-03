"""Source manifest management for tracking official documents and verification states."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime


class ManifestManager:
    def __init__(self, manifest_path: Optional[Path] = None):
        if manifest_path is None:
            manifest_path = Path(__file__).resolve().parent.parent.parent.parent / "knowledge-base" / "manifests" / "source_manifest.json"
        self.manifest_path = Path(manifest_path)

    def load_manifest(self) -> Dict[str, Any]:
        if not self.manifest_path.exists():
            return {"version": "1.0.0", "documents": []}
        with open(self.manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save_manifest(self, data: Dict[str, Any]):
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        data["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def get_document_entry(self, doc_id: str) -> Optional[Dict[str, Any]]:
        manifest = self.load_manifest()
        for doc in manifest.get("documents", []):
            if doc.get("documentId") == doc_id:
                return doc
        return None

    def update_document_entry(self, doc_id: str, updates: Dict[str, Any]):
        manifest = self.load_manifest()
        for doc in manifest.get("documents", []):
            if doc.get("documentId") == doc_id:
                doc.update(updates)
                self.save_manifest(manifest)
                return doc
        # If not found, append
        updates["documentId"] = doc_id
        manifest.setdefault("documents", []).append(updates)
        self.save_manifest(manifest)
        return updates
