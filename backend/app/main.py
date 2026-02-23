from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import auth, resume_api, analysis_api
from app.routes import interview_api












app = FastAPI(title="Skillio")

# Create tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# -----------------------------
# CORS (Frontend access)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite localhost
        "http://127.0.0.1:5173",  # Vite 127.0.0.1
        "http://localhost:5174",  # Vite fallback port we observed
        "http://127.0.0.1:5174",  # Vite fallback (127.0.0.1)
        "http://localhost:3000",  # Alternative frontend port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Root (MANDATORY)
# -----------------------------
@app.get("/")
def root():
    return "Skillio backend running"

# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(resume_api.router, prefix="/resume", tags=["Resume"])
app.include_router(analysis_api.router, prefix="/analysis", tags=["Analysis"])
app.include_router(interview_api.router)

import importlib
try:
    mod = importlib.import_module("app.routes.programming_interview_api")
    if hasattr(mod, "router"):
        app.include_router(mod.router)
    else:
        print(">>> PROGRAMMING INTERVIEW ROUTE NOT LOADED: 'router' missing")
except Exception as e:
    print(f">>> PROGRAMMING INTERVIEW ROUTE IMPORT FAILED: {e}")