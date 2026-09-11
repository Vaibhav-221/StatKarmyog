"""
Passport Engine — Computes competency history summaries and trajectory metrics.
"""

from typing import Any


def summarize_competency_history(scores: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Summarizes a list of historical score dicts for a single competency.
    `scores` must be ordered by recorded_on ascending.

    Returns dict with:
      - first_score (float | None)
      - latest_score (float | None)
      - improved (bool | None): True if latest > first, False if latest <= first (for len > 1).
                                None if len(scores) <= 1.
      - delta (float): latest_score - first_score (rounded to 2 decimals)
    """
    if not scores:
        return {
            "first_score": None,
            "latest_score": None,
            "improved": None,
            "delta": 0.0,
        }

    first = float(scores[0]["combined_score"])
    latest = float(scores[-1]["combined_score"])

    if len(scores) <= 1:
        improved = None
    else:
        improved = latest > first

    delta = round(latest - first, 2)

    return {
        "first_score": first,
        "latest_score": latest,
        "improved": improved,
        "delta": delta,
    }
