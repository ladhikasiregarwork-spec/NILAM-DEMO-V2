# Surat Keterangan Kerja OCR Service API

FastAPI wrapper for the root parser.

```bash
python3 -m pip install -r requirements.txt
python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Endpoints:

- `GET /health`
- `POST /parse`

Upload one or more PDFs per request. The service writes flat output files inside
the project root `output/` folder.

Open the simple upload UI at:

```text
http://127.0.0.1:8000/web
```
