"""AudiGene backend application.

FastAPI server providing sonification endpoints.
"""

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
