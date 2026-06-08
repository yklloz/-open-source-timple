import base64
import os
from urllib.parse import urlencode

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse

APP_DEEP_LINK = os.getenv("APP_DEEP_LINK", "signbridge://kakao-login")

app = FastAPI(title="SignBridge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def decode_return_uri(state: str | None) -> str:
    if not state:
        return APP_DEEP_LINK
    try:
        padded = state.replace("-", "+").replace("_", "/")
        padded += "=" * (-len(padded) % 4)
        return base64.b64decode(padded).decode("utf-8")
    except Exception:
        return APP_DEEP_LINK


@app.get("/")
def root():
    return {"name": "SignBridge API", "status": "ok"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/auth/kakao/callback")
def kakao_callback(
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
    state: str | None = Query(default=None),
):
    params = {}
    if code:
        params["code"] = code
    if error:
        params["error"] = error
    if error_description:
        params["error_description"] = error_description

    if not params:
        return JSONResponse(
            status_code=400,
            content={"detail": "Missing Kakao authorization result."},
        )

    return_uri = decode_return_uri(state)
    separator = "&" if "?" in return_uri else "?"
    return RedirectResponse(f"{return_uri}{separator}{urlencode(params)}")
