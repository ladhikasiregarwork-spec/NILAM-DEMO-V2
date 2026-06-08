# Surat Keterangan Kerja OCR

Parser-only project for extracting Surat Keterangan Kerja JSON from one uploaded
PDF or a folder of PDFs.

## Files

- `extract_keterangan_kerja.py`: the only script you run. Accepts one PDF or many PDFs.
- `extract_parser.py`: pypdfium2 text extraction and deterministic SKK field parser.
- `extract_ocr.py`: local Tesseract OCR text extraction for scanned PDFs.
- `extract_llm.py`: LLM text-only field matching fallback.
- `.env.example`: local LLM configuration template.

## Flow

1. `extract_keterangan_kerja.py` receives one PDF file or a folder.
2. If a PDF is password protected, the script asks for the password in the terminal.
3. `extract_parser.py` extracts text with pypdfium2.
4. A rule-based document classifier checks whether the PDF looks like a Surat Keterangan Kerja.
5. If text is weak or required values are missing, `extract_ocr.py` uses local Tesseract OCR.
6. If required fields are still missing, `extract_llm.py` sends text only to LLM for semantic label matching.
7. The final JSON is written as flat files in the output folder.

## Output Fields

Each document row includes:

- `nomor_surat`
- `tanggal_surat`
- `nama_pekerja`
- `nik`
- `jabatan`
- `departemen`
- `status_karyawan`
- `tanggal_mulai_kerja`
- `tanggal_akhir_kerja`
- `masa_kerja`
- `nama_institusi`
- `penandatangan`
- `jabatan_penandatangan`
- `tujuan_keterangan`
- `nomor_halaman`
- `classifikasi`

## Install

```bash
python3 -m pip install -r requirements.txt
```

For scanned/image PDFs, install Tesseract too:

```bash
brew install tesseract
```

This project uses local OCR by default for scanned samples. If Indonesian
Tesseract data is installed, you can set `OCR_LANGUAGE=ind+eng`; otherwise the
OCR module falls back to `eng`.

## Configure LLM Text Fallback

```bash
cp .env.example .env
```

Fill in `.env` with your LLM values. LLM receives text only, not PDF images. Do
not commit `.env`.

Set `KETERANGAN_KERJA_FALLBACK=true` to use the LLM text matcher whenever OCR
text is available. Without that flag, LLM is only used when required SKK fields
are missing. `SALARY_SLIP_FALLBACK` is also accepted as a backward-compatible
alias if you copied the `.env` from the salary-slip project; values such as
`true`, `llm`, or `azure` enable it.

## Run

Parse one PDF:

```bash
python3 extract_keterangan_kerja.py --input /path/to/surat.pdf --output output
```

Parse all PDFs in a folder:

```bash
python3 extract_keterangan_kerja.py --input input --output output
```

The script writes:

- `output/extracted.json`
- `output/summary.json`

When the input is a folder with multiple PDFs, all PDFs are treated as one
request and the two output files contain the combined result.

## FastAPI Service

The local API wrapper lives inside this project at `service-api/`. It only
handles uploads and calls the main parser in `extract_keterangan_kerja.py`.

```bash
python3 -m pip install -r service-api/requirements.txt
cd service-api
python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Then open:

```text
http://127.0.0.1:8000/web
```

The API docs stay available at:

```text
http://127.0.0.1:8000/docs
```
