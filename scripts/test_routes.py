import sys
import os
sys.path.insert(0, os.path.abspath("."))
from api.main import app

print("Successfully imported FastAPI app!")
for r in app.routes:
    methods = getattr(r, 'methods', None)
    print(f"{methods} -> {r.path}")
