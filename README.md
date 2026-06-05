# Acil Servis Personel Artırımı — Bulanık Mantık Kontrolcü

**Bulanık Mantık Dersi Dönem Projesi**

Gerçek dünya problemi olarak acil servis personel planlaması modellenmiştir. Proje, Kaggle **ER Wait Time** veri setindeki acil servis ziyaret kayıtlarından esinlenir; giriş değişkenleri (hasta yoğunluğu, aciliyet, hemşire oranı, bekleme süresi) bulanıklaştırılır; **18 IF-THEN kuralı** ile Mamdani çıkarım yapılır; çıkış **centroid (ağırlık merkezi)** ile durulaştırılır.

---

## Veri seti

**`er_dataset.csv` dosyası GitHub deposunda bulunmaz.** Kaggle üzerinden indirmeniz gerekir.

### İndirme linki

**[ER Wait Time — Kaggle (rivalytics)](https://www.kaggle.com/datasets/rivalytics/er-wait-time?resource=download)**

1. Yukarıdaki bağlantıya gidin (Kaggle hesabı gerekebilir).
2. **Download** ile veri setini indirin.
3. İndirilen CSV dosyasını proje köküne **`er_dataset.csv`** adıyla kaydedin:

```
acilServisYogunlukTahmin/
└── er_dataset.csv    ← buraya koyun
```

| Özellik | Açıklama |
|---------|----------|
| Kaynak | [Kaggle — ER Wait Time](https://www.kaggle.com/datasets/rivalytics/er-wait-time) |
| Kayıt sayısı | ~5.000 acil servis ziyareti |
| Kolon sayısı | 19 |

### Veri seti → bulanık kontrolcü eşlemesi

| CSV kolonu | Bulanık giriş | Açıklama |
|------------|---------------|----------|
| `Urgency Level` | Aciliyet skoru | Low / Medium / High / Critical → 0–10 skala |
| `Nurse-to-Patient Ratio` | Hemşire/hasta oranı | Oran ters çevrilerek 0–1 normalize edilir |
| `Total Wait Time (min)` | Bekleme süresi | 0–180 dk aralığına ölçeklenir |
| Ziyaret yoğunluğu | Hasta yoğunluğu | Saatlik/hastane bazlı doluluk % olarak türetilir |

Bu eşleme, gerçek acil servis verisinin bulanık kontrolcü girdilerine bağlanmasını sağlar. Arayüzdeki slider değerleri aynı aralıklarda manuel veya veri setinden türetilmiş örneklerle test edilebilir.

### Örnek CSV kolonları

- Visit ID, Patient ID, Hospital ID, Hospital Name, Region  
- Visit Date, Day of Week, Season, Time of Day, Urgency Level  
- Nurse-to-Patient Ratio, Specialist Availability, Facility Size (Beds)  
- Time to Registration / Triage / Medical Professional, Total Wait Time  
- Patient Outcome, Patient Satisfaction  

---

## Özellikler

- 4 giriş, 1 çıkış — her değişkende en az 3 dilsel terim
- 18 kural (≥15 şartı karşılanır)
- Centroid durulaştırma
- **Streamlit** arayüz: slider, Hesapla, üyelik grafikleri, aktif kurallar
- Senaryo testleri (`tests_scenarios.py`)
- Gerçek dünya verisi: Kaggle ER Wait Time (`er_dataset.csv`)

---

## Kurulum

**Gereksinimler:** Python 3.10+

```bash
git clone https://github.com/haticekctrk02/acilServisYogunlukTahmin.git
cd acilServisYogunlukTahmin

# Veri setini Kaggle'dan indirip er_dataset.csv olarak proje köküne koyun
# https://www.kaggle.com/datasets/rivalytics/er-wait-time?resource=download

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

> `er_dataset.csv` yoksa arayüz yine çalışır; slider ile manuel test yapılır. Veri seti senaryo analizi ve rapor bölümü için gereklidir.

---

## Çalıştırma

### Arayüz (Streamlit)

```bash
streamlit run app.py
```

Tarayıcıda **http://localhost:8501** açılır.

### Senaryo testleri

```bash
python tests_scenarios.py
```

Çıktı: `test_sonuclari.csv`, `test_sonuclari.png`

---

## Proje yapısı

```
├── er_dataset.csv         # Sizin indirdiğiniz dosya (GitHub'da YOK — Kaggle)
├── app.py                 # Streamlit arayüz
├── fuzzy_controller.py    # Bulanık kontrolcü (MF, çıkarım, durulaştırma)
├── rules.py               # 18 IF-THEN kuralı
├── tests_scenarios.py     # Test senaryoları
├── requirements.txt
├── RAPOR.md               # Dönem projesi raporu
└── README.md
```

---

## Giriş / Çıkış

| Değişken | Aralık | Terimler | Veri seti kaynağı |
|----------|--------|----------|-------------------|
| Hasta yoğunluğu | 0–100 % | Düşük, Orta, Yüksek | Ziyaret yoğunluğu |
| Aciliyet | 0–10 | Düşük, Orta, Kritik | `Urgency Level` |
| Hemşire/hasta oranı | 0–1 | Yetersiz, Yeterli, İyi | `Nurse-to-Patient Ratio` |
| Bekleme süresi | 0–180 dk | Kısa, Orta, Uzun | `Total Wait Time (min)` |
| **Çıkış:** Personel artırımı | 0–100 % | Centroid | — |

---

## Rapor

Akademik rapor: **[RAPOR.md](RAPOR.md)** — problem tanımı, tasarım, test, değerlendirme, kaynakça.

---

## Lisans

Eğitim amaçlı dönem projesi.
