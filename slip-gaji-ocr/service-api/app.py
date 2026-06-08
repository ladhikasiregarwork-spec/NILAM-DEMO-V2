#!/usr/bin/env python3
"""FastAPI wrapper for the salary slip parser.

One API request represents one nasabah/customer. Upload one or more PDFs for
that person, and the existing parser writes per-PDF extracted and summary JSON.
"""

from __future__ import annotations

import shutil
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse


BASE_DIR = Path(__file__).resolve().parent
PARSER_DIR = BASE_DIR.parent
RUNS_DIR = BASE_DIR / "runs"
WEB_UI_DIR = PARSER_DIR / "web-ui"
WEB_UI_INDEX = WEB_UI_DIR / "index.html"

sys.path.insert(0, str(PARSER_DIR))

from extract_salary import parse_upload  # noqa: E402


app = FastAPI(
    title="Salary Slip OCR Service API",
    description="Upload one or more salary-slip PDFs for one nasabah/customer per request.",
    version="1.0.0",
)


def patch_upload_file_schema(value: object) -> None:
    if isinstance(value, dict):
        if value.get("contentMediaType") == "application/octet-stream":
            value.pop("contentMediaType", None)
            value["format"] = "binary"
        for child in value.values():
            patch_upload_file_schema(child)
    elif isinstance(value, list):
        for child in value:
            patch_upload_file_schema(child)


def custom_openapi() -> dict:
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    patch_upload_file_schema(openapi_schema)
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


def new_run_id() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]


async def save_uploads(files: list[UploadFile], upload_dir: Path) -> list[str]:
    saved_files = []
    upload_dir.mkdir(parents=True, exist_ok=True)

    for upload in files:
        file_name = Path(upload.filename or "").name
        if not file_name:
            continue
        if not file_name.casefold().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file_name} is not a PDF file.")

        target = upload_dir / file_name
        with target.open("wb") as output:
            shutil.copyfileobj(upload.file, output)
        saved_files.append(file_name)

    if not saved_files:
        raise HTTPException(status_code=400, detail="Upload at least one PDF file.")
    return saved_files


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "parser_folder": str(PARSER_DIR)}


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/web")


@app.get("/web", include_in_schema=False)
def web_ui() -> FileResponse:
    if not WEB_UI_INDEX.exists():
        raise HTTPException(status_code=404, detail="Web UI is not installed.")
    return FileResponse(WEB_UI_INDEX)


@app.post("/parse")
async def parse_salary_slips(
    files: list[UploadFile] = File(..., description="One or more salary-slip PDFs for one nasabah."),
    password: Optional[str] = Form(None, description="Optional PDF password if the uploaded PDFs are protected."),
) -> JSONResponse:
    run_id = new_run_id()
    run_dir = RUNS_DIR / run_id
    upload_dir = run_dir / "uploads"
    output_dir = run_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    saved_files = await save_uploads(files, upload_dir)
    summary = parse_upload(
        upload_dir,
        output_dir,
        password=password,
        allow_password_prompt=False,
    )
    needs_password = any(
        "password" in (error.get("kesalahan") or "").casefold()
        for error in summary.get("kesalahan", [])
    )
    return JSONResponse(
        {
            "ok": True,
            "needs_password": needs_password,
            "run_id": run_id,
            "uploaded_files": saved_files,
            "summary": summary,
            "output_files": {
                "output_folder": str(output_dir),
                "extracted": str(output_dir / "extracted.json"),
                "summary": str(output_dir / "summary.json"),
            },
        }
    )
