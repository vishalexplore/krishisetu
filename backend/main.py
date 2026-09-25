from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base

from models.farm import Farm
from models.soil import SoilTest
from models.crop_diagnosis import CropDiagnosis
from models.profile import Profile

from routes.farms import router as farm_router
from routes.soil import router as soil_router
from routes.advisor import router as advisor_router
from routes.weather import router as weather_router
from routes.crop_doctor import router as crop_doctor_router
from routes.satellite import router as satellite_router
from routes.profile import router as profile_router


app = FastAPI(
    title="KrishiSetu API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://krishisetu-farm.netlify.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Register routes
app.include_router(farm_router)
app.include_router(advisor_router)
app.include_router(weather_router)
app.include_router(soil_router)
app.include_router(crop_doctor_router)
app.include_router(satellite_router)
app.include_router(profile_router)


@app.get("/")
def root():
    return {
        "message": "KrishiSetu API is running",
        "database": "PostgreSQL",
        "postgis": "enabled",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }