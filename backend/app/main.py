from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.api import api_router
from app.db.database import get_db
from app.db.init_db import init_db, seed_initial_data

load_dotenv()

init_db()

app = FastAPI(
    title="Japanese Restaurant Information API",
    description="API for retrieving and searching Japanese restaurant information",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Japanese Restaurant Information API",
        "version": "0.1.0",
        "docs_url": "/docs",
        "api_prefix": "/api/v1",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/seed-data", status_code=201)
async def seed_data(db: Session = Depends(get_db)):
    seed_initial_data(db)
    return {"message": "Initial data seeded successfully"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
