"""
er_dataset.csv yükleme ve bulanık kontrolcü girdilerine dönüştürme.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from fuzzy_controller import FuzzyInputs

CSV_PATH = Path(__file__).parent / "er_dataset.csv"

URGENCY_TO_SCORE = {
    "Low": 2.0,
    "Medium": 5.0,
    "High": 7.5,
    "Critical": 9.5,
}

NURSE_RATIO_MIN = 1
NURSE_RATIO_MAX = 6


@dataclass
class VisitRecord:
    visit_id: str
    hospital_name: str
    hospital_id: str
    visit_date: str
    urgency_level: str
    nurse_ratio_raw: float
    wait_time_raw: float
    beds: int
    hourly_visits: int
    fuzzy: FuzzyInputs

    @property
    def label(self) -> str:
        return (
            f"{self.visit_id} | {self.urgency_level} | "
            f"{self.wait_time_raw:.0f} dk bekleme"
        )


def _nurse_ratio_to_score(ratio: float) -> float:
    """Düşük hasta/hemşire oranı = daha iyi personel (0-1, yüksek iyi)."""
    ratio = float(ratio)
    score = (NURSE_RATIO_MAX - ratio) / (NURSE_RATIO_MAX - NURSE_RATIO_MIN)
    return round(max(0.0, min(1.0, score)), 2)


def _wait_time_to_score(minutes: float) -> float:
    return round(max(0.0, min(180.0, float(minutes))), 1)


def _urgency_to_score(level: str) -> float:
    return URGENCY_TO_SCORE.get(str(level), 5.0)


@dataclass
class DatasetBundle:
    df: pd.DataFrame
    records: list[VisitRecord]
    hospitals: list[str]
    urgency_levels: list[str]


@dataclass
class DensityAnalysis:
    scope: str
    mean_density: float
    median_density: float
    max_density: float
    min_density: float
    peak_hour: int
    peak_hour_density: float
    low_count: int
    mid_count: int
    high_count: int
    total_records: int
    level_label: str
    recommended_yogunluk: float
    by_hospital: pd.DataFrame
    hourly_profile: pd.DataFrame


def _density_level(value: float) -> str:
    if value < 35:
        return "Düşük"
    if value < 65:
        return "Orta"
    return "Yüksek"


def analyze_density(bundle: DatasetBundle, hospital: str | None = None) -> DensityAnalysis:
    """Veri setinden yoğunluk analizi — hastane veya tüm veri."""
    df = bundle.df.copy()
    scope = hospital if hospital and hospital != "Tümü" else "Tüm hastaneler"

    if hospital and hospital != "Tümü":
        df = df[df["Hospital Name"] == hospital]

    df["hour"] = df["Visit Date"].dt.hour
    hourly_profile = (
        df.groupby("hour", as_index=False)["yogunluk_pct"]
        .mean()
        .rename(columns={"yogunluk_pct": "ortalama_yogunluk"})
    )
    peak_idx = hourly_profile["ortalama_yogunluk"].idxmax()
    peak_hour = int(hourly_profile.loc[peak_idx, "hour"])
    peak_hour_density = float(hourly_profile.loc[peak_idx, "ortalama_yogunluk"])

    mean_d = float(df["yogunluk_pct"].mean())
    by_hospital = (
        bundle.df.groupby("Hospital Name", as_index=False)
        .agg(
            ortalama=("yogunluk_pct", "mean"),
            maksimum=("yogunluk_pct", "max"),
            kayit=("yogunluk_pct", "count"),
        )
        .sort_values("ortalama", ascending=False)
    )

    low = int((df["yogunluk_pct"] < 35).sum())
    mid = int(((df["yogunluk_pct"] >= 35) & (df["yogunluk_pct"] < 65)).sum())
    high = int((df["yogunluk_pct"] >= 65).sum())

    return DensityAnalysis(
        scope=scope,
        mean_density=round(mean_d, 1),
        median_density=round(float(df["yogunluk_pct"].median()), 1),
        max_density=round(float(df["yogunluk_pct"].max()), 1),
        min_density=round(float(df["yogunluk_pct"].min()), 1),
        peak_hour=peak_hour,
        peak_hour_density=round(peak_hour_density, 1),
        low_count=low,
        mid_count=mid,
        high_count=high,
        total_records=len(df),
        level_label=_density_level(mean_d),
        recommended_yogunluk=round(mean_d, 1),
        by_hospital=by_hospital,
        hourly_profile=hourly_profile,
    )


def load_dataset(path: Path | str = CSV_PATH) -> DatasetBundle:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"er_dataset.csv bulunamadı: {path}\n"
            "Kaggle: https://www.kaggle.com/datasets/rivalytics/er-wait-time"
        )

    df = pd.read_csv(path)
    df["Visit Date"] = pd.to_datetime(df["Visit Date"])
    df["visit_hour"] = df["Visit Date"].dt.floor("h")

    hourly = (
        df.groupby(["Hospital ID", "visit_hour"])
        .size()
        .reset_index(name="hourly_visits")
    )
    df = df.merge(hourly, on=["Hospital ID", "visit_hour"], how="left")

    beds = df["Facility Size (Beds)"].clip(lower=1)
    df["yogunluk_pct"] = (df["hourly_visits"] / beds * 100).clip(0, 100)

    records: list[VisitRecord] = []
    for _, row in df.iterrows():
        fuzzy = FuzzyInputs(
            yogunluk=round(float(row["yogunluk_pct"]), 1),
            aciliyet=_urgency_to_score(row["Urgency Level"]),
            hemsire_orani=_nurse_ratio_to_score(row["Nurse-to-Patient Ratio"]),
            bekleme_suresi=_wait_time_to_score(row["Total Wait Time (min)"]),
        )
        records.append(
            VisitRecord(
                visit_id=str(row["Visit ID"]),
                hospital_name=str(row["Hospital Name"]),
                hospital_id=str(row["Hospital ID"]),
                visit_date=str(row["Visit Date"]),
                urgency_level=str(row["Urgency Level"]),
                nurse_ratio_raw=float(row["Nurse-to-Patient Ratio"]),
                wait_time_raw=float(row["Total Wait Time (min)"]),
                beds=int(row["Facility Size (Beds)"]),
                hourly_visits=int(row["hourly_visits"]),
                fuzzy=fuzzy,
            )
        )

    hospitals = sorted(df["Hospital Name"].unique().tolist())
    urgency_levels = sorted(df["Urgency Level"].unique().tolist())
    return DatasetBundle(df=df, records=records, hospitals=hospitals, urgency_levels=urgency_levels)


def filter_records(
    bundle: DatasetBundle,
    hospital: str | None = None,
    urgency: str | None = None,
) -> list[VisitRecord]:
    records = bundle.records
    if hospital and hospital != "Tümü":
        records = [r for r in records if r.hospital_name == hospital]
    if urgency and urgency != "Tümü":
        records = [r for r in records if r.urgency_level == urgency]
    return records


def apply_fuzzy_to_session(record: VisitRecord) -> dict[str, float]:
    return {
        "yogunluk": record.fuzzy.yogunluk,
        "aciliyet": record.fuzzy.aciliyet,
        "hemsire": record.fuzzy.hemsire_orani,
        "bekleme": record.fuzzy.bekleme_suresi,
    }
