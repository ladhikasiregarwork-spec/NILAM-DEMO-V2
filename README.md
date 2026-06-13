# NILAM — Demo KPR (BRI) · V2

**NILAM** adalah prototipe alur pengajuan **KPR** yang *document-centric*: nasabah meng-upload dokumen (KTP, KK, Slip Gaji, SK, Mutasi rekening), lalu sistem **mengklasifikasi + meng-OCR** dokumen, menarik **SLIK**, menaksir **Nilai Pasar Wajar (NPW)** agunan, menghitung **kemampuan bayar** + **credit score**, dan menghasilkan **penawaran KPR** beserta jadwal **akad** — semuanya berjalan **lokal** (tanpa host korporat).

> **Tata letak (V2):** dua aplikasi mobile berdampingan — **HP Nasabah** (alur pengajuan) + **HP Relationship Manager** (survey agunan) — dengan **dashboard analis** full-width di bawahnya. Satu layar memperlihatkan input nasabah, keputusan RM, sekaligus hasil analisis kredit.

### 🆕 Yang baru di V2
- **Relationship Manager (RM)** sebagai aplikasi mobile tersendiri.
- **Gate survey ≥ Rp500 juta:** agunan bernilai ≥ Rp500jt **wajib disurvey RM** dulu sebelum penawaran terbit; < Rp500jt langsung ke penawaran.
- **Perhitungan agunan dilakukan RM** saat survey (taksiran × LTV → plafon agunan).
- **Survey harga tanah sekitar** sebagai pembanding terhadap NPW.
- **Dashboard berbasis kartu** dengan tab internal + kartu **Ringkasan & Keputusan** (Approve/Reject) yang rinciannya bisa di-*expand*.

---

## ✨ Fitur Utama

- **Satu menu upload** untuk semua dokumen → tiap berkas **diklasifikasi otomatis** (KTP / KK / Slip Gaji / SK / Mutasi) lalu di-OCR sesuai jenisnya.
- **OCR per dokumen (lokal):**
  - **KTP** → PaddleOCR lokal (NIK, nama, gender, TTL, alamat, status kawin)
  - **KK** → PaddleOCR mobile **+** Tesseract (union anggota), pasangan nama↔NIK via posisi box
  - **Slip Gaji** → per tanggal bayar: upah, potongan, THP, THR, bonus
  - **SK Kerja** → 2 format (SKK & Kutipan SK BRI)
  - **Mutasi** (e-Statement BRImo) → transaksi + klasifikasi *gaji / THR / bonus*, multi-bulan
- **SLIK OJK** dari Excel → fasilitas, bunga, angsuran, kolektibilitas, total angsuran, **+ Riwayat Tunggakan** (timeline kolektibilitas 12 bulan + 2 fasilitas terburuk).
- **NPW (Nilai Pasar Wajar)** → model ML lokal (nilai tanah + nilai bangunan) + **survey harga tanah sekitar** sebagai pembanding.
- **Relationship Manager (RM)** → antrian survey agunan ≥ Rp500jt; RM isi taksiran + klasifikasi LTV → **plafon agunan**, lalu Setujui/Tolak (diteruskan ke nasabah).
- **Perhitungan Agunan** → plafon agunan = **NPW (atau taksiran RM) × LTV**.
- **Kemampuan Bayar** = (gaji + THR/12 + bonus/12 − angsuran SLIK) × **DIR** — bonus dapat diedit, plafond & DP ikut menyesuaikan.
- **Credit Scoring** 9 faktor.
- **Income Nasabah** (matching slip ↔ mutasi) → rekap bulanan (Slip vs Mutasi Rekening), penanda hijau/merah cocok/selisih.
- **Penawaran KPR** → bunga *fixed → floating*, tenor menyesuaikan usia, plafon di-cap ke **min(NPW×LTV, kemampuan)** (sisanya jadi **tambahan DP**).
- **Akad** → dana dibiayai, rincian DP saat akad, kantor cabang & tanggal akad.
- **Gambar agunan** dari link listing (og:image) + **Preview dokumen** di dashboard.

---

## 🏗️ Arsitektur

Browser (Next.js) memanggil **route proxy** internal (`/api/*`) yang meneruskan ke dua service **FastAPI** lokal. Semua di `localhost` — tidak ada dependensi host korporat/VPN.

```
┌────────────────────────┐
│  Web — Next.js (3010)  │  UI + route proxy /api/*
└───────────┬────────────┘
            │  (HTTP localhost)
    ┌───────┴────────────────────────────┐
    ▼                                     ▼
┌───────────────────────────┐   ┌────────────────────────────┐
│ Classifier + OCR  (8020)  │   │ NPW model        (8030)    │
│ local_classifier/         │   │ house_fair_market_value/   │
│ Tesseract · PaddleOCR     │   │ FastAPI · pandas · pyarrow │
│ SLIK (Excel)              │   │ /predict → land/bldg/fair  │
└───────────────────────────┘   └────────────────────────────┘
```

| Komponen | Port | Folder | Teknologi |
|---|---|---|---|
| Web (UI + proxy) | `3010` | [nilam-prototype/](nilam-prototype/) | Next.js 15 · React 19 · TypeScript · Tailwind |
| Classifier + OCR + SLIK | `8020` | [local_classifier/](local_classifier/) | FastAPI · Tesseract · PaddleOCR · openpyxl |
| NPW (Nilai Pasar Wajar) | `8030` | [house_fair_market_value/](house_fair_market_value/) | FastAPI · pandas · pyarrow (· catboost opsional) |

**Route proxy** (Next.js → service):

| Route | Meneruskan ke |
|---|---|
| `/api/ocr/classify` | classifier `8020` |
| `/api/ocr/identitas` · `/slip` · `/mutasi` · `/sk` | classifier `8020` |
| `/api/slik` | classifier `8020` |
| `/api/npw` | NPW `8030` |
| `/api/agunan/from-link` | Rumah123 + Nominatim (eksternal, opsional) |

---

## 🔄 Alur Aplikasi

```
Pembukaan → Syarat & Ketentuan → Upload Dokumen → Data Diri
   → (Prescreening) → Data Agunan → Pemrosesan
   → [agunan ≥ Rp500jt]  → Survey RM → (Setujui)  ┐
   → [agunan < Rp500jt]  ───────────────────────  ├→ Penawaran KPR → Akad
```

**Gate survey (≥ Rp500 juta):** setelah pemrosesan, agunan ≥ Rp500jt masuk **antrian HP RM**. Nasabah menunggu; RM membuka pengajuan, melihat **pembanding harga tanah sekitar**, mengisi **nilai taksiran + klasifikasi LTV** (plafon = taksiran × LTV), lalu **Setujui** (penawaran terbit pakai taksiran RM) atau **Tolak**. Agunan < Rp500jt langsung ke penawaran.

---

## ✅ Prasyarat

- **Node.js** 18+ (diuji pada v24)
- **Python** 3.12
- **Tesseract OCR** — untuk OCR Slip/Mutasi/SK/KK
  - Windows: install ke `C:\Program Files\Tesseract-OCR`, lalu tambahkan ke `PATH`.
- Model **PaddleOCR** (KTP) ter-*download* otomatis saat pertama kali dijalankan (butuh internet sekali di awal).

> **Internet:** aplikasi berjalan di `localhost` dan bisa dipakai offline/di WiFi mana pun. Internet hanya dibutuhkan untuk: (a) unduh model PaddleOCR pertama kali, dan (b) fitur opsional "ambil data dari link Rumah123".

---

## 🚀 Menjalankan

Jalankan **3 proses** (sebaiknya 3 terminal terpisah).

### 1. Web — Next.js

```bash
cd nilam-prototype
npm install
npm run dev -- -p 3010
```

Buka **http://localhost:3010**.

### 2. Service Python (siapkan environment sekali)

Dari root repo:

```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

pip install fastapi "uvicorn[standard]" pydantic pandas numpy pyarrow \
            pypdfium2 pillow paddlepaddle paddleocr openpyxl requests
# (NPW juga menyediakan: pip install -r house_fair_market_value/requirements.txt)
```

### 3. Classifier + OCR + SLIK — port 8020

```bash
uvicorn classifier_app:app --app-dir local_classifier --host 127.0.0.1 --port 8020
```

### 4. NPW (Nilai Pasar Wajar) — port 8030

```bash
uvicorn house_fair_market_value.app:app --host 127.0.0.1 --port 8030
```

> Cek kesehatan: `http://127.0.0.1:8030/health` dan upload dokumen lewat UI untuk menguji classifier.

---

## ⚙️ Konfigurasi (Environment Variables)

Semua punya **default**, jadi opsional.

| Variabel | Default | Keterangan |
|---|---|---|
| `CLASSIFIER_URL` | `http://127.0.0.1:8020` | URL service classifier/OCR/SLIK (dibaca route Next.js). |
| `NPW_URL` | `http://127.0.0.1:8030` | URL service NPW. |
| `SLIK_XLSX` | *path sampel* | Path file Excel SLIK yang dibaca classifier. **Set ke file SLIK Anda.** |
| `TESS_USE_IND` | *(off)* | `1` untuk memakai data bahasa Indonesia Tesseract (`ind`). |
| `PADDLE_OCR_URL` | *(off)* | Bila di-set, OCR scan dialihkan ke PaddleOCR korporat (kualitas terbaik). Tanpa ini → PaddleOCR/Tesseract lokal. |
| `PADDLE_OCR_KEY` | *(off)* | `X-API-Key` untuk service PaddleOCR korporat. |

**NPW lookup (opsional):** taruh `location_feature_lookup.parquet` di `house_fair_market_value/artifacts/` untuk taksiran per-lokasi. Bila tidak ada, service memakai **fallback median** secara otomatis.

---

## 📁 Struktur Repo

```
.
├── nilam-prototype/            # Aplikasi web (UI nasabah + dashboard analis)
│   ├── app/                    # Next.js App Router (halaman + route /api proxy)
│   ├── components/
│   │   ├── mobile/             # Layar alur nasabah (HP) + SurveyScreen
│   │   ├── rm/                 # Aplikasi mobile Relationship Manager (survey agunan)
│   │   └── dashboard/          # Kartu analisis (income, SLIK, agunan, ringkasan+keputusan)
│   ├── engines/                # Logika murni (NPW proxy, matching, scoring)
│   ├── hooks/                  # useNilamFlow — state machine alur
│   ├── lib/ · data/ · types/   # util, matriks LTV/DIR, tipe
│   └── package.json
├── local_classifier/           # FastAPI: klasifikasi + OCR + SLIK (port 8020)
│   └── classifier_app.py
├── house_fair_market_value/    # FastAPI: model NPW (port 8030)
│   ├── app.py · service.py
│   └── requirements.txt
└── README.md
```

> Folder `ocr_*` dan `*-ocr/` adalah paket OCR awal yang diadaptasi; logika aktif kini terkonsolidasi di `local_classifier/`.

---

## 🧮 Catatan Teknis

- **KPR (anuitas):** `angsuran = P × i/(1 − (1+i)^−n)`; skema **fixed → floating**; tenor maksimum menyesuaikan usia pemohon.
- **LTV:** matriks BRI — rumah baru (tier developer × tipe properti × ukuran) dan rumah lama (secondary by harga / refinancing 70%).
- **Kemampuan bayar (DIR):** penghasilan < 15 jt → 50%, ≤ 25 jt → 55%, > 25 jt → 60%.
- **Plafon penawaran** di-*cap* ke **min(NPW × LTV, kemampuan)**; kekurangan terhadap (harga − DP) menjadi **tambahan DP** yang dibayar saat akad.
- **NPW:** prediksi nilai tanah + bangunan dari `luas_tanah`, `luas_bangunan`, `kode_pos`, `kelurahan`.

---

## ⚠️ Disclaimer

Repositori ini adalah **prototipe/demo** untuk keperluan eksplorasi dan presentasi — **bukan** produk resmi maupun sistem produksi BRI. Semua pemrosesan dilakukan secara lokal; gunakan hanya dengan data uji.
