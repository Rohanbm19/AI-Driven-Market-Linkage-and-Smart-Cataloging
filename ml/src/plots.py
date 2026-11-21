"""Save evaluation charts under ml/outputs/."""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.decomposition import PCA

sns.set_theme(style="whitegrid")


def save_actual_vs_predicted(y_true, y_pred, title: str, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, axis = plt.subplots(figsize=(7, 5))
    axis.scatter(y_true, y_pred, alpha=0.65, color="#c2410c")
    minimum = min(min(y_true), min(y_pred))
    maximum = max(max(y_true), max(y_pred))
    axis.plot([minimum, maximum], [minimum, maximum], "--", color="#444")
    axis.set_xlabel("Actual (test set)")
    axis.set_ylabel("Predicted (test set)")
    axis.set_title(title)
    fig.tight_layout()
    fig.savefig(output_path, dpi=140)
    plt.close(fig)
    return output_path


def save_cluster_pca(features, labels, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pca = PCA(n_components=2, random_state=42)
    points = pca.fit_transform(features)
    frame = pd.DataFrame(
        {"pc1": points[:, 0], "pc2": points[:, 1], "cluster": labels.astype(str)}
    )
    fig, axis = plt.subplots(figsize=(7, 5))
    sns.scatterplot(data=frame, x="pc1", y="pc2", hue="cluster", ax=axis, palette="Set2")
    axis.set_title("Customer clusters (PCA view of sample data)")
    fig.tight_layout()
    fig.savefig(output_path, dpi=140)
    plt.close(fig)
    return output_path


def save_trend_lines(monthly_frame: pd.DataFrame, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, axis = plt.subplots(figsize=(9, 5))
    sns.lineplot(
        data=monthly_frame,
        x="year_month",
        y="units_sold",
        hue="product_category",
        ax=axis,
    )
    axis.set_title("Monthly units sold by category (sample data)")
    axis.tick_params(axis="x", rotation=60)
    fig.tight_layout()
    fig.savefig(output_path, dpi=140)
    plt.close(fig)
    return output_path
