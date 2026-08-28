import os
import sys

# Ensure project root is on sys.path for Vercel execution
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes import sonification

app = FastAPI(
    title="AudiGene",
    description="Scientifically grounded biological sequence sonification",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sonification.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
