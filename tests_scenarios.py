"""
Senaryo testleri — farklı giriş kombinasyonlarında bulanık kontrolcü çıkışları.
Çalıştırma: python tests_scenarios.py
"""
import matplotlib.pyplot as plt
import pandas as pd

from fuzzy_controller import ERPersonelFuzzyController, FuzzyInputs

SCENARIOS = [
    {
        "ad": "Sakin gece",
        "yogunluk": 15,
        "aciliyet": 2.0,
        "hemsire_orani": 0.85,
        "bekleme_suresi": 20,
        "beklenti": "Düşük personel artırımı",
    },
    {
        "ad": "Normal öğlen",
        "yogunluk": 50,
        "aciliyet": 5.0,
        "hemsire_orani": 0.5,
        "bekleme_suresi": 75,
        "beklenti": "Orta personel artırımı",
    },
    {
        "ad": "Yoğun acil",
        "yogunluk": 88,
        "aciliyet": 9.0,
        "hemsire_orani": 0.25,
        "bekleme_suresi": 150,
        "beklenti": "Yüksek personel artırımı",
    },
    {
        "ad": "Kritik vaka, personel yeterli",
        "yogunluk": 55,
        "aciliyet": 8.5,
        "hemsire_orani": 0.6,
        "bekleme_suresi": 45,
        "beklenti": "Yüksek veya orta-yüksek",
    },
    {
        "ad": "Düşük aciliyet, uzun bekleme",
        "yogunluk": 40,
        "aciliyet": 3.0,
        "hemsire_orani": 0.35,
        "bekleme_suresi": 130,
        "beklenti": "Orta personel artırımı",
    },
    {
        "ad": "Aşırı yoğunluk",
        "yogunluk": 95,
        "aciliyet": 6.0,
        "hemsire_orani": 0.3,
        "bekleme_suresi": 100,
        "beklenti": "Yüksek personel artırımı",
    },
]


def run_tests() -> pd.DataFrame:
    ctrl = ERPersonelFuzzyController()
    rows = []
    for s in SCENARIOS:
        inp = FuzzyInputs(
            yogunluk=s["yogunluk"],
            aciliyet=s["aciliyet"],
            hemsire_orani=s["hemsire_orani"],
            bekleme_suresi=s["bekleme_suresi"],
        )
        res = ctrl.compute(inp)
        active = [r["id"] for r in res.rule_activations if r["active"]]
        rows.append(
            {
                "Senaryo": s["ad"],
                "Yoğunluk": s["yogunluk"],
                "Aciliyet": s["aciliyet"],
                "Hemşire Oranı": s["hemsire_orani"],
                "Bekleme (dk)": s["bekleme_suresi"],
                "Çıkış (%)": res.personel_artirimi,
                "Aktif Kurallar": ", ".join(map(str, active[:5])),
                "Beklenti": s["beklenti"],
            }
        )
    return pd.DataFrame(rows)


def plot_comparison(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(df["Senaryo"], df["Çıkış (%)"], color="#3b82f6", edgecolor="#1e40af")
    ax.axhline(35, color="#22c55e", linestyle="--", alpha=0.7, label="Düşük/Orta sınır (~35)")
    ax.axhline(65, color="#ef4444", linestyle="--", alpha=0.7, label="Orta/Yüksek sınır (~65)")
    ax.set_ylabel("Personel artırımı (%)")
    ax.set_title("Senaryo Test Sonuçları — Centroid Çıkışı")
    ax.tick_params(axis="x", rotation=25)
    for bar, val in zip(bars, df["Çıkış (%)"]):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1, f"{val:.1f}", ha="center", fontsize=9)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig("test_sonuclari.png", dpi=150)
    plt.close(fig)
    print("Grafik kaydedildi: test_sonuclari.png")


if __name__ == "__main__":
    df = run_tests()
    print("\n=== SENARYO TEST SONUÇLARI ===\n")
    print(df.to_string(index=False))
    df.to_csv("test_sonuclari.csv", index=False, encoding="utf-8-sig")
    print("\nTablo kaydedildi: test_sonuclari.csv")
    plot_comparison(df)
