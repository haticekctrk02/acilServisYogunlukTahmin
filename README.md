# Acil Servis Yoğunluk Tahmin Sistemi

**Yapay Zeka Destekli Acil Servis Kapasite Tahmini**

Hastaneler ve acil servis yöneticileri için kurumsal düzeyde sağlık analitiği paneli. Acil servis yoğunluğunu tahmin eder, anlık ve geçmiş metrikleri görselleştirir, yönetici raporları sunar.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Veri seti](#veri-seti)
- [Teknoloji yığını](#teknoloji-yığını)
- [Kurulum](#kurulum)
- [Komutlar](#komutlar)
- [Proje yapısı](#proje-yapısı)
- [Tasarım sistemi](#tasarım-sistemi)
- [Dil desteği](#dil-desteği)
- [Sınırlamalar](#sınırlamalar)

---

## Özellikler

### Kontrol paneli
- 6 KPI kartı (doluluk, tahmin, bekleme süresi, risk, yatak, personel)
- Sparkline grafikleri ve trend göstergeleri
- AI tahmin merkezi ve risk yönetimi paneli

### Tahmin
- Hastane, gün, mevsim, saat, aciliyet, bölge, personel girdileri
- Sıcaklık, hava durumu, tatil ve önceki saat hasta sayısı
- Yoğunluk seviyeleri: **DÜŞÜK / ORTA / YÜKSEK / KRİTİK**
- Bekleme süresi ve personel önerisi

### Canlı izleme
- Güncel hasta, yatak, doktor, hemşire metrikleri
- Ambulans varışları ve kuyruk
- Ortalama hasta memnuniyeti

### Analitik
- Saatlik hasta trendi
- Haftalık ısı haritası
- Aylık ziyaret ve mevsimsel kullanım
- Bekleme süresi dağılımı
- Hasta sonuçları (taburcu / yatış)
- Triyaj aşama süreleri (kayıt → triyaj → müdahale)

### Geçmiş veriler
- Arama, filtre, sıralama, sayfalama
- ML tahmin vs gerçek hasta sayısı karşılaştırması

### Raporlar
- PDF ve Excel dışa aktarma
- Haftalık / aylık rapor şablonları

### ML analizleri
- Model doğruluğu, precision, recall, RMSE, MAE
- Özellik önemi grafiği (veriden hesaplanır)

### Diğer
- Türkçe / İngilizce arayüz (Ayarlar’dan seçilir)
- Koyu mod
- Üst çubukta arama, bildirimler, hastane seçici, profil
- Tam responsive tasarım

---

## Veri seti

**Veri seti bu depoda (GitHub) bulunmaz.** Kaggle üzerinden indirmeniz gerekir.

### İndirme linki

**[ER Wait Time — Kaggle (rivalytics)](https://www.kaggle.com/datasets/rivalytics/er-wait-time?resource=download)**

1. Yukarıdaki bağlantıya gidin (Kaggle hesabı gerekebilir).
2. **Download** ile veri setini indirin.
3. İndirilen CSV dosyasını proje köküne **`er_dataset.csv`** adıyla kaydedin:

```
acilServisYogunlukTahmin/
└── er_dataset.csv    ← buraya koyun
```

4. Ardından `npm run dev` veya `npm run sync-dataset` komutu dosyayı `public/` klasörüne kopyalar.

```bash
npm run sync-dataset
```

| Özellik | Açıklama |
|---------|----------|
| Kaynak | [Kaggle — ER Wait Time](https://www.kaggle.com/datasets/rivalytics/er-wait-time) |
| Yerel dosya adı | `er_dataset.csv` (proje kökü) |
| Uygulama yolu | `public/er_dataset.csv` (otomatik kopyalanır) |
| Kayıt sayısı | ~5.000 acil servis ziyareti |
| Kolon sayısı | 19 |

### CSV kolonları (özet)

- Visit ID, Patient ID, Hospital ID, Hospital Name, Region  
- Visit Date, Day of Week, Season, Time of Day, Urgency Level  
- Nurse-to-Patient Ratio, Specialist Availability, Facility Size (Beds)  
- Time to Registration / Triage / Medical Professional, Total Wait Time  
- Patient Outcome, Patient Satisfaction  

---

## Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Arayüz | React 18, TypeScript |
| Derleme | Vite 5 |
| Stil | Tailwind CSS |
| Grafikler | Recharts |
| İkonlar | Lucide React |
| Yönlendirme | React Router 6 |
| Dışa aktarma | jsPDF, xlsx |
| Test | Vitest |

---

## Kurulum

### Gereksinimler

- Node.js 18+  
- npm  

### Adımlar

```bash
# 1. Depoyu klonlayın
git clone <repo-url>
cd acilServisYogunlukTahmin

# 2. Veri setini Kaggle'dan indirip er_dataset.csv olarak proje köküne koyun
#    https://www.kaggle.com/datasets/rivalytics/er-wait-time?resource=download

# 3. Bağımlılıkları yükleyin
npm install

# 4. Veri setini public/ klasörüne kopyalayın (npm run dev bunu da yapar)
npm run sync-dataset

# 5. Geliştirme sunucusu
npm run dev
```

Tarayıcıda açın: **http://localhost:5173**

> `er_dataset.csv` yoksa uygulama açılmaz veya veri yükleme hatası görürsünüz. Önce Kaggle indirmesini tamamlayın.

---

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Derlenmiş sürümü önizle |
| `npm run test` | Birim testleri |
| `npm run sync-dataset` | `er_dataset.csv` → `public/` kopyala |

---

## Proje yapısı

```
acilServisYogunlukTahmin/
├── er_dataset.csv          # Sizin indirdiğiniz dosya (GitHub'da YOK — Kaggle)
├── public/
│   └── er_dataset.csv      # npm run sync-dataset ile oluşur
├── src/
│   ├── components/         # UI, layout, grafik, tahmin, risk
│   ├── pages/              # Sayfalar (Dashboard, Tahmin, Canlı, …)
│   ├── services/           # CSV, ML model, arama, export
│   ├── context/            # Veri seti ve dil sağlayıcıları
│   ├── hooks/              # Tema, saat, ayarlar, canlı veri
│   ├── i18n/               # Türkçe / İngilizce çeviriler
│   ├── types/              # TypeScript tipleri
│   └── utils/              # CSV ayrıştırıcı
├── package.json
└── README.md
```

### Sayfalar

| Rota | Sayfa |
|------|--------|
| `/` | Kontrol Paneli |
| `/predictions` | Tahminler |
| `/live` | Canlı İzleme |
| `/analytics` | Analitik |
| `/historical` | Geçmiş Veriler |
| `/reports` | Raporlar |
| `/ml-insights` | ML Analizleri |
| `/settings` | Ayarlar |
| `/profile` | Profil |

---

## Tasarım sistemi

| Token | Renk | Kullanım |
|-------|------|----------|
| Primary | `#2563EB` | Ana marka, butonlar |
| Secondary | `#0EA5E9` | İkincil vurgu |
| Success | `#22C55E` | Düşük risk, başarı |
| Warning | `#F59E0B` | Orta risk, uyarı |
| Critical | `#EF4444` | Kritik risk, alarm |
| Arka plan | `#F8FAFC` | Açık tema zemin |
| Koyu zemin | `#0F172A` | Koyu tema |
| Kart (koyu) | `#1E293B` | Koyu mod kartlar |

---

## Dil desteği

- Varsayılan dil: **Türkçe**
- **Ayarlar → Bölgesel** menüsünden İngilizce seçilebilir
- Tercih `localStorage` içinde saklanır
- Sayfa başlığı ve meta açıklama dile göre güncellenir

---

## Sınırlamalar

Bu sürüm **ön yüz (frontend) prototipi** olarak tasarlanmıştır:

- **CSV dosyası repoda yoktur;** [Kaggle](https://www.kaggle.com/datasets/rivalytics/er-wait-time?resource=download) üzerinden indirilmelidir.
- Veriler statik CSV dosyasından okunur; canlı HBYS/API bağlantısı yoktur.
- Makine öğrenimi tarayıcıda basit bir lineer model ile çalışır; Python üretim modeli yoktur.
- Sıcaklık ve hava durumu gibi alanlar veri setinde olmadığı için mevsim/saat kurallarıyla türetilir.
- Canlı izleme metrikleri simüle edilir (periyodik yenileme).

Üretim ortamı için backend API, kimlik doğrulama ve gerçek zamanlı veri akışı eklenmesi önerilir.

---

## Lisans

Bu proje eğitim ve demonstrasyon amaçlıdır.
