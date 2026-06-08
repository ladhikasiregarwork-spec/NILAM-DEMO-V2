# Salary Slip OCR Service API

FastAPI wrapper for the parser in the parent `salary-slip-ocr` folder.

One request equals one nasabah/customer. Upload one or more salary-slip PDFs for
that person in the same request.

## Install

From the main project folder:

```bash
python3 -m pip install -r requirements.txt
python3 -m pip install -r service-api/requirements.txt
```

For scanned PDFs, Tesseract is also needed:

```bash
brew install tesseract
```

## Run

```bash
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

## Endpoint

`POST /parse`

Form fields:

- `files`: one or more PDF files.
- `password`: optional PDF password.

Example:

```bash
curl -X POST "http://127.0.0.1:8000/parse" \
  -F "files=@/path/to/slip_1.pdf" \
  -F "files=@/path/to/slip_2.pdf" \
  -F "password=988156"
```

Response includes:

- `summary`: compact combined nasabah-level JSON with `metadata`, `nasabah`, `periode`, `dokumen`, and `kesalahan`.
- `output_files.output_folder`: folder containing `summary.json` and `extracted.json`.
- `needs_password`: `true` when a PDF needs a password or the password is wrong.
- Rejected non-salary-slip PDFs appear in `summary.kesalahan` with `classifikasi`.
