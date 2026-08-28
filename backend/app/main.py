import os
import sys

# Ensure project root is on sys.path for Vercel execution
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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


# Serve frontend static files if dist directory exists
DIST_DIR = os.path.join(ROOT_DIR, "frontend", "dist")

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str = ""):
        if full_path.startswith("api/"):
            return FileResponse(os.path.join(DIST_DIR, "index.html"))
        
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend build not found"}
else:
    @app.get("/")
    def index():
        return {"message": "AudiGene Backend is running. Frontend build not present."}

