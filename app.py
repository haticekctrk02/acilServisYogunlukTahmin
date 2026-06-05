"""
Acil Servis Personel Artırımı — Bulanık Mantık Kontrolcü Arayüzü (Streamlit)
"""
import matplotlib.pyplot as plt
import streamlit as st

from dataset_service import (
    analyze_density,
    apply_fuzzy_to_session,
    filter_records,
    load_dataset,
)
from fuzzy_controller import ERPersonelFuzzyController, FuzzyInputs

st.set_page_config(
    page_title="Acil Servis Bulanık Kontrolcü",
    page_icon="🏥",
    layout="wide",
)

TERM_COLORS = {
    "dusuk": "#22c55e",
    "orta": "#f59e0b",
    "yuksek": "#ef4444",
    "kritik": "#b91c1c",
    "yetersiz": "#ef4444",
    "yeterli": "#f59e0b",
    "iyi": "#22c55e",
    "kisa": "#22c55e",
    "uzun": "#ef4444",
}


@st.cache_resource
def get_controller() -> ERPersonelFuzzyController:
    return ERPersonelFuzzyController()


@st.cache_data
def get_dataset():
    return load_dataset()


def init_session_defaults() -> None:
    defaults = {"yogunluk": 65, "aciliyet": 7.5, "hemsire": 0.35, "bekleme": 95}
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


def plot_membership(universe, terms: dict, current_value: float, title: str, xlabel: str):
    fig, ax = plt.subplots(figsize=(6, 3.2))
    for term, mf in terms.items():
        label = ERPersonelFuzzyController.TERM_LABELS.get(term, term)
        color = TERM_COLORS.get(term, "#64748b")
        ax.plot(universe, mf, label=label, linewidth=2, color=color)
    ax.axvline(current_value, color="#1e293b", linestyle="--", linewidth=1.5, label=f"Giriş: {current_value:.1f}")
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.set_xlabel(xlabel)
    ax.set_ylabel("Üyelik derecesi (μ)")
    ax.set_ylim(-0.05, 1.1)
    ax.legend(loc="upper right", fontsize=8)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    return fig


def plot_output_with_centroid(universe, terms: dict, centroid: float, aggregated_y):
    fig, ax = plt.subplots(figsize=(8, 2.6), dpi=96)
    fig.subplots_adjust(bottom=0.22, top=0.82, left=0.08, right=0.97)
    for term, mf in terms.items():
        label = ERPersonelFuzzyController.TERM_LABELS.get(term, term)
        ax.plot(universe, mf, label=label, linewidth=1.2, alpha=0.35, color=TERM_COLORS.get(term, "#94a3b8"))
    if aggregated_y is not None and len(aggregated_y) > 0:
        ax.fill_between(universe, 0, aggregated_y, alpha=0.45, color="#3b82f6", label="Birleşik çıkış MF")
    ax.axvline(centroid, color="#dc2626", linestyle="-", linewidth=2, label=f"Centroid: {centroid:.1f}%")
    ax.set_title("Çıkış — Personel Artırımı (Durulaştırma)", fontsize=10, fontweight="bold", pad=6)
    ax.set_xlabel("Personel artırımı (%)", fontsize=9)
    ax.set_ylabel("μ", fontsize=9)
    ax.tick_params(labelsize=8)
    ax.set_ylim(-0.05, 1.1)
    ax.legend(
        loc="upper center",
        bbox_to_anchor=(0.5, -0.18),
        ncol=4,
        fontsize=7,
        frameon=False,
    )
    ax.grid(True, alpha=0.25)
    return fig


def plot_density_by_hospital(df):
    fig, ax = plt.subplots(figsize=(8, 3), dpi=96)
    colors = ["#ef4444" if v >= 65 else "#f59e0b" if v >= 35 else "#22c55e" for v in df["ortalama"]]
    ax.barh(df["Hospital Name"], df["ortalama"], color=colors, edgecolor="#e2e8f0")
    ax.axvline(35, color="#64748b", linestyle="--", linewidth=1, alpha=0.6)
    ax.axvline(65, color="#64748b", linestyle="--", linewidth=1, alpha=0.6)
    ax.set_xlabel("Ortalama yoğunluk (%)")
    ax.set_title("Hastane bazlı yoğunluk", fontsize=10, fontweight="bold")
    ax.set_xlim(0, max(df["ortalama"].max() * 1.15, 10))
    ax.grid(axis="x", alpha=0.25)
    fig.tight_layout()
    return fig


def plot_hourly_density(hourly_df, peak_hour: int):
    fig, ax = plt.subplots(figsize=(8, 2.8), dpi=96)
    ax.plot(
        hourly_df["hour"],
        hourly_df["ortalama_yogunluk"],
        marker="o",
        color="#3b82f6",
        linewidth=2,
        markersize=4,
    )
    ax.axvline(peak_hour, color="#ef4444", linestyle="--", linewidth=1.5, label=f"Pik saat: {peak_hour}:00")
    ax.fill_between(hourly_df["hour"], hourly_df["ortalama_yogunluk"], alpha=0.15, color="#3b82f6")
    ax.set_xlabel("Saat")
    ax.set_ylabel("Ort. yoğunluk (%)")
    ax.set_title("Saatlik yoğunluk profili", fontsize=10, fontweight="bold")
    ax.set_xticks(range(0, 24, 2))
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.25)
    fig.tight_layout()
    return fig


def plot_density_distribution(low: int, mid: int, high: int):
    fig, ax = plt.subplots(figsize=(4, 2.8), dpi=96)
    labels = ["Düşük\n(<35%)", "Orta\n(35-65%)", "Yüksek\n(≥65%)"]
    vals = [low, mid, high]
    colors = ["#22c55e", "#f59e0b", "#ef4444"]
    ax.bar(labels, vals, color=colors, edgecolor="#e2e8f0")
    ax.set_ylabel("Kayıt sayısı")
    ax.set_title("Yoğunluk seviye dağılımı", fontsize=10, fontweight="bold")
    for i, v in enumerate(vals):
        ax.text(i, v + max(vals) * 0.02, str(v), ha="center", fontsize=9)
    fig.tight_layout()
    return fig


def sync_density_to_session(analysis, hospital_key: str) -> None:
    """Hastane seçimine göre yoğunluk slider'ını veri analizinden günceller."""
    if st.session_state.get("last_density_hospital") != hospital_key:
        st.session_state["yogunluk"] = float(analysis.recommended_yogunluk)
        st.session_state["last_density_hospital"] = hospital_key


controller = get_controller()
init_session_defaults()

st.title("🏥 Acil Servis Personel Artırımı — Bulanık Kontrolcü")
st.markdown(
    "Bulanık Mantık Dersi dönem projesi · Mamdani çıkarım · Centroid durulaştırma · "
    f"**{len(controller.rules)} kural** · **er_dataset.csv**"
)

bundle = None
density_analysis = None
sel_hospital = "Tümü"

with st.sidebar:
    st.header("Veri seti (er_dataset.csv)")
    try:
        bundle = get_dataset()
        st.caption(f"{len(bundle.records):,} ziyaret · {len(bundle.hospitals)} hastane")

        sel_hospital = st.selectbox("Hastane", ["Tümü"] + bundle.hospitals, key="sel_hospital")
        density_analysis = analyze_density(bundle, sel_hospital)
        sync_density_to_session(density_analysis, sel_hospital)

        sel_urgency = st.selectbox("Aciliyet filtresi", ["Tümü"] + bundle.urgency_levels)
        filtered = filter_records(bundle, sel_hospital, sel_urgency)

        if filtered:
            visit_labels = {r.visit_id: r.label for r in filtered[:500]}
            if len(filtered) > 500:
                st.caption(f"İlk 500 kayıt gösteriliyor (toplam {len(filtered)})")
            sel_visit_id = st.selectbox(
                "Ziyaret kaydı",
                options=list(visit_labels.keys()),
                format_func=lambda vid: visit_labels[vid],
            )
            selected = next(r for r in filtered if r.visit_id == sel_visit_id)

            if st.button("Kaydı slider'lara uygula", use_container_width=True):
                applied = apply_fuzzy_to_session(selected)
                st.session_state.update(applied)
                st.session_state["selected_visit"] = selected.visit_id
                st.rerun()

            if st.button("Rastgele kayıt", use_container_width=True):
                import random

                pick = random.choice(filtered)
                st.session_state.update(apply_fuzzy_to_session(pick))
                st.session_state["selected_visit"] = pick.visit_id
                st.rerun()
        else:
            st.warning("Filtreye uygun kayıt yok.")
            selected = None
    except FileNotFoundError as e:
        st.error(str(e))
        selected = None

    st.divider()
    st.header("Giriş Değişkenleri")
    yogunluk = st.slider(
        "Hasta yoğunluğu (%)",
        0,
        100,
        key="yogunluk",
        help="Saatlik ziyaret / yatak kapasitesi (veri setinden)",
    )
    aciliyet = st.slider(
        "Aciliyet skoru (0-10)",
        0.0,
        10.0,
        0.1,
        key="aciliyet",
        help="Urgency Level → skor",
    )
    hemsire = st.slider(
        "Hemşire/hasta oranı (0-1)",
        0.0,
        1.0,
        0.01,
        key="hemsire",
        help="Nurse-to-Patient Ratio (yüksek = iyi)",
    )
    bekleme = st.slider(
        "Bekleme süresi (dk)",
        0,
        180,
        key="bekleme",
        help="Total Wait Time (min)",
    )
    st.divider()
    hesapla = st.button("Hesapla", type="primary", use_container_width=True)
    st.caption("Slider'ları elle ayarlayın veya veri setinden kayıt yükleyin.")

selected_visit_id = st.session_state.get("selected_visit")
if selected_visit_id:
    try:
        rec = next(r for r in get_dataset().records if r.visit_id == selected_visit_id)
        with st.expander("Seçili veri seti kaydı", expanded=False):
            c1, c2, c3, c4 = st.columns(4)
            c1.markdown(f"**Visit ID:** {rec.visit_id}")
            c2.markdown(f"**Hastane:** {rec.hospital_name}")
            c3.markdown(f"**Aciliyet:** {rec.urgency_level}")
            c4.markdown(f"**Tarih:** {rec.visit_date}")
            st.markdown(
                f"CSV ham değerler → Hemşire oranı: **{rec.nurse_ratio_raw}**, "
                f"Bekleme: **{rec.wait_time_raw:.0f} dk**, "
                f"Saatlik ziyaret: **{rec.hourly_visits}**, Yatak: **{rec.beds}**"
            )
    except (StopIteration, FileNotFoundError):
        pass

if density_analysis:
    st.subheader(f"📊 Yoğunluk Analizi — {density_analysis.scope}")
    st.caption("er_dataset.csv yüklendi · analiz otomatik üretildi · yoğunluk slider'ı buna göre ayarlandı")

    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Ortalama yoğunluk", f"%{density_analysis.mean_density}")
    m2.metric("Medyan", f"%{density_analysis.median_density}")
    m3.metric("Maksimum", f"%{density_analysis.max_density}")
    m4.metric("Pik saat", f"{density_analysis.peak_hour}:00")
    m5.metric("Seviye", density_analysis.level_label)

    d1, d2, d3 = st.columns([2, 2, 1])
    with d1:
        st.pyplot(
            plot_density_by_hospital(density_analysis.by_hospital),
            clear_figure=True,
            use_container_width=True,
        )
    with d2:
        st.pyplot(
            plot_hourly_density(density_analysis.hourly_profile, density_analysis.peak_hour),
            clear_figure=True,
            use_container_width=True,
        )
    with d3:
        st.pyplot(
            plot_density_distribution(
                density_analysis.low_count,
                density_analysis.mid_count,
                density_analysis.high_count,
            ),
            clear_figure=True,
            use_container_width=True,
        )

    total = max(density_analysis.total_records, 1)
    st.info(
        f"**{density_analysis.scope}** için {density_analysis.total_records:,} kayıt analiz edildi. "
        f"Düşük: **{density_analysis.low_count}** ({density_analysis.low_count/total*100:.1f}%) · "
        f"Orta: **{density_analysis.mid_count}** ({density_analysis.mid_count/total*100:.1f}%) · "
        f"Yüksek: **{density_analysis.high_count}** ({density_analysis.high_count/total*100:.1f}%). "
        f"Pik yoğunluk **{density_analysis.peak_hour}:00** saatinde "
        f"(ort. **%{density_analysis.peak_hour_density}**). "
        f"Bulanık giriş yoğunluğu: **%{density_analysis.recommended_yogunluk}**"
    )
    st.divider()

inputs = FuzzyInputs(
    yogunluk=float(yogunluk),
    aciliyet=float(aciliyet),
    hemsire_orani=float(hemsire),
    bekleme_suresi=float(bekleme),
)

result = controller.compute(inputs)
if hesapla:
    st.success("Hesaplama tamamlandı.")

col_out1, col_out2, col_out3 = st.columns(3)
with col_out1:
    st.metric("Personel artırımı (çıkış)", f"%{result.personel_artirimi:.1f}")
with col_out2:
    active_count = sum(1 for r in result.rule_activations if r["active"])
    st.metric("Aktif kural sayısı", active_count)
with col_out3:
    level = "Düşük" if result.personel_artirimi < 35 else "Orta" if result.personel_artirimi < 65 else "Yüksek"
    st.metric("Öneri seviyesi", level)

st.subheader("Giriş üyelik fonksiyonları")
g1, g2 = st.columns(2)
g3, g4 = st.columns(2)
input_vals = {
    "yogunluk": yogunluk,
    "aciliyet": aciliyet,
    "hemsire_orani": hemsire,
    "bekleme_suresi": bekleme,
}
plots = [
    ("yogunluk", "Hasta Yoğunluğu", "%"),
    ("aciliyet", "Aciliyet Skoru", "skor"),
    ("hemsire_orani", "Hemşire/Hasta Oranı", "oran"),
    ("bekleme_suresi", "Bekleme Süresi", "dk"),
]
cols = [g1, g2, g3, g4]
for col, (var, title, unit) in zip(cols, plots):
    u, terms = controller.get_antecedent_plot_data(var)
    with col:
        st.pyplot(plot_membership(u, terms, input_vals[var], title, unit), clear_figure=True)

st.subheader("Giriş bulanıklaştırma (μ değerleri)")
mem_cols = st.columns(4)
for col, (var, title, _) in zip(mem_cols, plots):
    with col:
        st.markdown(f"**{title}**")
        for term, mu in result.input_memberships[var].items():
            label = controller.TERM_LABELS.get(term, term)
            st.progress(min(mu, 1.0), text=f"{label}: {mu:.2f}")

st.subheader("Aktif kurallar ve aktivasyon gücü")
active_rules = [r for r in result.rule_activations if r["active"]]
if active_rules:
    for r in active_rules:
        st.markdown(f"**Kural {r['id']}** (μ={r['strength']:.3f}): {r['text']}")
else:
    st.info("Belirgin aktif kural yok (tüm μ < 0.01).")

with st.expander("Tüm kurallar (18 adet)"):
    for r in result.rule_activations:
        mark = "✅" if r["active"] else "○"
        st.text(f"{mark} Kural {r['id']:02d} | μ={r['strength']:.3f} | {r['text']}")

st.subheader("Çıkış — durulaştırma (centroid)")
out_u, out_terms = controller.get_consequent_plot_data()
_, agg_y = result.output_membership_curve

out_col_chart, out_col_info = st.columns([2, 1])
with out_col_chart:
    st.pyplot(
        plot_output_with_centroid(out_u, out_terms, result.centroid_x, agg_y),
        clear_figure=True,
        use_container_width=True,
    )
with out_col_info:
    st.metric("Centroid çıkışı", f"%{result.personel_artirimi:.2f}")
    st.markdown("**Durulaştırma:** Ağırlık merkezi (centroid)")
    st.markdown("**Çıkış aralığı:** 0 – 100 %")
    if result.personel_artirimi < 35:
        st.success("Öneri: Düşük personel artırımı")
    elif result.personel_artirimi < 65:
        st.warning("Öneri: Orta personel artırımı")
    else:
        st.error("Öneri: Yüksek personel artırımı")

st.divider()
st.caption("Bulanık Mantık · scikit-fuzzy · Streamlit · Acil Servis Yoğunluk Tahmin")
