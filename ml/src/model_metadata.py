"""Model metadata and dependency compatibility helpers."""

from __future__ import annotations

import importlib.metadata
import json
import platform
from pathlib import Path

REQUIRED_LIBRARIES = (
    "pandas",
    "numpy",
    "scikit-learn",
    "matplotlib",
    "seaborn",
    "joblib",
)


def library_versions() -> dict:
    return {
        name: importlib.metadata.version(name)
        for name in REQUIRED_LIBRARIES
    }


def model_metadata(
    *,
    model_version: str,
    dataset_type: str,
    training_date_range: dict | None,
    feature_names: list[str],
    evaluation_metrics: dict,
    preprocessing_logic: str,
) -> dict:
    return {
        "model_version": model_version,
        "training_date": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "dataset_type": dataset_type,
        "training_date_range": training_date_range,
        "feature_names": feature_names,
        "evaluation_metrics": evaluation_metrics,
        "library_versions": library_versions(),
        "python_version": platform.python_version(),
        "preprocessing_logic": preprocessing_logic,
    }


def write_model_metadata(model_path: Path, metadata: dict) -> Path:
    path = model_path.with_suffix(model_path.suffix + ".metadata.json")
    path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return path


def validate_model_metadata(model_path: Path, metadata: dict) -> None:
    if not isinstance(metadata, dict):
        raise ValueError("Saved model metadata is missing or invalid.")
    missing = {
        "model_version",
        "training_date",
        "dataset_type",
        "training_date_range",
        "feature_names",
        "evaluation_metrics",
        "library_versions",
        "preprocessing_logic",
    } - set(metadata)
    if missing:
        raise ValueError(f"Incompatible saved model: missing metadata fields: {sorted(missing)}")
    current = library_versions()
    if metadata["library_versions"] != current:
        raise ValueError(
            "Saved model was trained with incompatible library versions. "
            f"Saved={metadata['library_versions']}; current={current}. Retrain the model."
        )
