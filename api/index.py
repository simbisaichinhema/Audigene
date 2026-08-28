import os
import sys

# Ensure root workspace directory is in Python path for Vercel deployment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app

# Handler for Vercel Serverless Functions
handler = app
