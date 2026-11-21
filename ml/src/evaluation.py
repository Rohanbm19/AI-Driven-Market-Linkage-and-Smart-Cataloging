"""Metrics and report helpers for regression, clustering and trend summaries."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import (
    davies_bouldin_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    silhouette_score,
)


def regression_metrics(y_true, y_predicted) -> dict:
    y_true = np.asarray(y_true, dtype=float)
    y_predicted = np.asarray(y_predicted, dtype=float)
    mae = float(mean_absolute_error(y_true, y_predicted))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_predicted)))
    r_squared = float(r2_score(y_true, y_predicted))
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r_squared, 4),
        "n_samples": int(len(y_true)),
        "note": (
            "Scores are measured on the held-out test split of the current "
            "dataset. They are not a claim of real-world market accuracy."
        ),
    }


def clustering_metrics(features, labels) -> dict:
    labels = np.asarray(labels)
    unique_labels = np.unique(labels)
    report = {
        "n_clusters_found": int(len(unique_labels)),
        "n_samples": int(len(labels)),
        "cluster_sizes": {str(int(label)): int((labels == label).sum()) for label in unique_labels},
    }
    if len(unique_labels) < 2 or len(labels) <= len(unique_labels):
        report["silhouette"] = None
        report["davies_bouldin"] = None
        report["note"] = "Need at least two clusters and more points than clusters."
        return report
    report["silhouette"] = round(float(silhouette_score(features, labels)), 4)
    report["davies_bouldin"] = round(float(davies_bouldin_score(features, labels)), 4)
    report["note"] = (
        "Silhouette is closer to 1 when clusters separate well. "
        "Davies-Bouldin is lower when clusters are compact and apart. "
        "These scores describe this sample only."
    )
    return report


def format_metrics_block(title: str, metrics: dict) -> str:
    lines = [title]
    for key, value in metrics.items():
        lines.append(f"  {key}: {value}")
    return "\n".join(lines)


def write_json_report(path: Path, payload: dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    return path


def write_text_report(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def metrics_frame(name: str, metrics: dict) -> pd.DataFrame:
    row = {"model": name}
    row.update(metrics)
    return pd.DataFrame([row])
