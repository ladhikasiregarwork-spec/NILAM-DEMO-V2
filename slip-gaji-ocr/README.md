# Salary Slip OCR

Parser-only project for extracting salary-slip JSON from one uploaded PDF or a
folder of PDFs.

## Files

- `extract_salary.py`: the only script you run. Accepts one PDF or many PDFs.
- `extract_parser.py`: pypdfium2 deterministic parser.
- `extract_ocr.py`: local Tesseract OCR text extraction.
- `extract_llm.py`: LLM text-only field matching.
- `.env.example`: local LLM configuration template.

## Flow

1. `extract_salary.py` receives one PDF file or a folder.
2. If a PDF is password protected, the script asks for the password in the terminal.
3. `extract_parser.py` extracts text with pypdfium2.
4. A rule-based document classifier checks whether the PDF looks like a salary slip.
5. If text is weak or required values are missing, `extract_ocr.py` uses local Tesseract OCR.
6. If required fields or similar payroll keywords are still missing, `extract_llm.py` sends text only to LLM for semantic label matching.
7. The final JSON uses one deduction value only.

## Output Fields

Each result includes:

- `total_dibayar`
- `gaji_pokok`
- `tunjangan`
- `potongan`
- `nama_institusi`
- `nama_pekerja`
- `nomor_halaman`
- `tanggal_periode`
- `classifikasi`

Formula:

```text
total_dibayar = gaji_pokok + tunjangan - potongan
```

`total_dibayar` can also use `Total Penghasilan Bruto` / `Bruto` when total deductions are blank or zero.
`gaji_pokok` can use labels containing `Gaji`, including OCR variants such as `Gafi`.
`tunjangan` means THR, bonus, allowance, overtime, and other positive additions beside gaji pokok.
`potongan` means all decreases combined into one number, including tax/PPh/pajak and any other deduction.

## Install

```bash
python3 -m pip install -r requirements.txt
```

For scanned/image PDFs, install Tesseract too:

```bash
brew install tesseract
```

## Configure LLM Text Fallback

```bash
cp .env.example .env
```

Fill in `.env` with your LLM values. LLM receives text only, not PDF images. Do not commit `.env`.

## Run

Parse one PDF:

```bash
python3 extract_salary.py --input /path/to/slip.pdf --output output
```

Parse all PDFs in a folder:

```bash
python3 extract_salary.py --input input --output output
```

Password-protected PDFs:

```bash
python3 extract_salary.py --input input --output output
Password required for protected-slip.pdf (attempt 1/3):
```

The password input is hidden. A correct password is reused in memory for other PDFs in the same run, so a folder of slips with the same password only needs one successful password entry. Passwords are not written to JSON, `.env`, or any project file.

You can also pass a password directly when running one protected file:

```bash
python3 extract_salary.py --input input/sample_13.pdf --output output --password 988156
```

The script writes:

- `output/extracted.json`
- `output/summary.json`

When the input is a folder with multiple PDFs, all PDFs are treated as salary
slips for the same person/nasabah and the two output files contain the combined
result.

## FastAPI Service

The local API wrapper lives inside this project at `service-api/`. It only
handles uploads and calls the main parser in `extract_salary.py`.

```bash
python3 -m pip install -r service-api/requirements.txt
cd service-api
python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Then open:

```text
http://127.0.0.1:8000/web
```

API docs are still available at:

```text
http://127.0.0.1:8000/docs
```

Each `summary.json` includes:

- `metadata`: generated time, document count, and output folder.
- `nasabah`: unique worker and institution names.
- `periode.jumlah`: number of unique month/year periods.
- `periode.bulanan`: totals grouped by the same month and year.
- `periode.rata_rata`: averages across grouped month/year totals.
- `periode.total`: totals across all parsed documents.
- `dokumen`: one row per parsed page/PDF.
- `kesalahan`: failed PDFs, if any.

The document classifier uses payroll keywords, employee/period labels, money
values, and negative document keywords. Classification statuses are:

- `accepted`: likely salary slip; parsed normally.
- `uncertain`: possible salary slip; parsed with classification warning.
- `rejected`: not recognized as salary slip; skipped and reported in `kesalahan`.
