"""
Competency Trend & Projection Engine — Phase 7.

Implements transparent heuristic trend projection using linear regression / extrapolation.
This is explicitly a simple heuristic estimate, NOT a trained machine-learning model.
"""

from datetime import datetime


EPSILON_MONTHLY_SLOPE = 0.05  # Slopes within [-0.05, 0.05] per month are classified as "flat"


def project_trend(history: list[dict]) -> dict:
    """
    Project competency trend from an officer's historical score records.

    Input: history = list of dicts with 'recorded_on' (ISO date str) and 'combined_score' (float).

    Returns dict containing:
      - trend: "improving" | "declining" | "flat" | "insufficient_data"
      - slope_per_month: float | None
      - projected_next_score: float | None (clamped to [1.0, 5.0])
      - data_points_used: int
      - confidence_note: str (mandatory disclosure)
    """
    n_points = len(history) if history else 0
    confidence_note = (
        f"Heuristic linear projection from {n_points} data points — "
        f"not a trained predictive model. More data points improve reliability."
    )

    if n_points < 2:
        return {
            "trend": "insufficient_data",
            "message": "Need at least 2 assessments to estimate a trend",
            "slope_per_month": None,
            "projected_next_score": None,
            "data_points_used": n_points,
            "confidence_note": confidence_note,
        }

    # Parse and sort history by date ascending
    parsed = []
    for item in history:
        raw_date = str(item.get("recorded_on", "")).split("T")[0]
        try:
            dt = datetime.strptime(raw_date, "%Y-%m-%d")
        except ValueError:
            dt = datetime.utcnow()
        score = float(item.get("combined_score", 0.0))
        parsed.append((dt, score))

    parsed.sort(key=lambda x: x[0])
    first_dt = parsed[0][0]

    # Convert dates to days since first record
    x_days = [(dt - first_dt).days for dt, _ in parsed]
    y_scores = [score for _, score in parsed]

    if n_points == 2:
        # Simple linear extrapolation between 2 points
        days_diff = x_days[1] - x_days[0]
        # Avoid division by zero if both assessments occurred on the same day
        days_interval = float(days_diff) if days_diff > 0 else 30.0
        slope_per_day = (y_scores[1] - y_scores[0]) / days_interval
        slope_per_month = slope_per_day * 30.0

        # Project 30 days forward from latest record
        raw_projected = y_scores[1] + (slope_per_day * 30.0)

    else:
        # 3+ points: Simple least-squares linear regression over (x_days, y_scores)
        mean_x = sum(x_days) / float(n_points)
        mean_y = sum(y_scores) / float(n_points)

        numerator = sum((x_days[i] - mean_x) * (y_scores[i] - mean_y) for i in range(n_points))
        denominator = sum((x_days[i] - mean_x) ** 2 for i in range(n_points))

        if denominator == 0.0:
            slope_per_day = 0.0
        else:
            slope_per_day = numerator / denominator

        slope_per_month = slope_per_day * 30.0

        # Project 30 days forward from the latest data point
        raw_projected = y_scores[-1] + (slope_per_day * 30.0)

    # Classify trend direction using epsilon threshold
    if abs(slope_per_month) < EPSILON_MONTHLY_SLOPE:
        trend = "flat"
    elif slope_per_month > 0:
        trend = "improving"
    else:
        trend = "declining"

    # Clamp projected score to valid scale [1.0, 5.0]
    clamped_projected = max(1.0, min(5.0, round(raw_projected, 2)))
    rounded_slope = round(slope_per_month, 2)

    return {
        "trend": trend,
        "slope_per_month": rounded_slope,
        "projected_next_score": clamped_projected,
        "data_points_used": n_points,
        "confidence_note": confidence_note,
    }
