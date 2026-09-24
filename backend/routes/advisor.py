from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google import genai
from dotenv import load_dotenv
from database import get_db
from models.farm import Farm
from models.soil import SoilTest
import os
import time

load_dotenv()

router = APIRouter(prefix="/advisor", tags=["Farmer Advisor"])

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured in backend/.env"
    )

client = genai.Client(api_key=api_key)

MODEL = "gemini-3.6-flash"


class AdvisorRequest(BaseModel):
    farm_id: int
    problem: str
    language: str = "hi"


@router.post("/")
def get_advice(
    request: AdvisorRequest,
    db: Session = Depends(get_db),
):
    problem = request.problem.strip()
    language = request.language.lower()

    if not problem:
        raise HTTPException(
            status_code=400,
            detail="Problem is required.",
        )

    # --------------------------------------------------
    # 1. FARM DATA
    # --------------------------------------------------

    farm = (
        db.query(Farm)
        .filter(Farm.id == request.farm_id)
        .first()
    )

    if not farm:
        raise HTTPException(
            status_code=404,
            detail="Farm not found.",
        )

    # --------------------------------------------------
    # 2. SOIL DATA
    # --------------------------------------------------

    soil = (
        db.query(SoilTest)
        .filter(SoilTest.farm_id == farm.id)
        .order_by(SoilTest.id.desc())
        .first()
    )

    # --------------------------------------------------
    # 3. SATELLITE / NDVI DATA
    # --------------------------------------------------

    ndvi = None
    satellite_health = "Not available"

    try:
        import ee

        region = ee.Geometry.Point(
            [
                float(farm.longitude),
                float(farm.latitude),
            ]
        ).buffer(100)

        from datetime import datetime, timedelta

        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=60)

        collection = (
            ee.ImageCollection(
                "COPERNICUS/S2_SR_HARMONIZED"
            )
            .filterBounds(region)
            .filterDate(
                str(start_date),
                str(end_date + timedelta(days=1)),
            )
            .filter(
                ee.Filter.lt(
                    "CLOUDY_PIXEL_PERCENTAGE",
                    40,
                )
            )
        )

        image_count = collection.size().getInfo()

        if image_count > 0:
            composite = collection.median()

            ndvi_image = composite.normalizedDifference(
                ["B8", "B4"]
            ).rename("NDVI")

            stats = ndvi_image.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=region,
                scale=10,
                maxPixels=100000,
            ).getInfo()

            value = stats.get("NDVI")

            if value is not None:
                ndvi = round(float(value), 3)

                if ndvi >= 0.60:
                    satellite_health = "Healthy"
                elif ndvi >= 0.35:
                    satellite_health = "Moderate"
                elif ndvi >= 0.15:
                    satellite_health = "Stressed"
                else:
                    satellite_health = "Very Low Vegetation"

    except Exception as e:
        print(
            "Advisor Earth Engine context error:",
            repr(e),
        )

    # --------------------------------------------------
    # 4. LANGUAGE
    # --------------------------------------------------

    if language == "hi":
        language_instruction = """
Answer completely in simple Hindi.
Use language that an Indian farmer can easily understand.
Important agricultural terms may be written in English
inside brackets when useful.
"""
    else:
        language_instruction = """
Answer completely in simple English.
Keep the advice practical and easy for a farmer to understand.
"""

    # --------------------------------------------------
    # 5. SOIL CONTEXT
    # --------------------------------------------------

    if soil:
        soil_context = f"""
Latest soil test:
pH: {soil.ph}
Moisture: {soil.moisture}
Nitrogen: {soil.nitrogen}
Phosphorus: {soil.phosphorus}
Potassium: {soil.potassium}
Organic Carbon: {soil.organic_carbon}
"""
    else:
        soil_context = """
No soil test is currently available for this farm.
"""

    # --------------------------------------------------
    # 6. SATELLITE CONTEXT
    # --------------------------------------------------

    if ndvi is not None:
        satellite_context = f"""
Satellite monitoring:
NDVI: {ndvi}
Vegetation health: {satellite_health}
Analysis source: Sentinel-2 through Google Earth Engine
Analysis period: approximately 60 days
"""
    else:
        satellite_context = """
Satellite NDVI data is currently unavailable.
"""

    # --------------------------------------------------
    # 7. GEMINI PROMPT
    # --------------------------------------------------

    prompt = f"""
You are KrishiSetu AI Farmer Advisor.

You are helping an Indian farmer using real farm,
soil and satellite information.

FARM INFORMATION
----------------
Farm name: {farm.name}
Crop: {farm.crop}
Area: {farm.area_acres} acres
Latitude: {farm.latitude}
Longitude: {farm.longitude}
Sowing date: {farm.sowing_date}

FARMER'S CURRENT PROBLEM
------------------------
{problem}

SOIL INFORMATION
----------------
{soil_context}

SATELLITE INFORMATION
---------------------
{satellite_context}

{language_instruction}

Give practical, farm-specific agricultural guidance.

Structure the response as:

1. Problem / possible cause
2. What to do now
3. Soil / irrigation considerations
4. What the satellite NDVI suggests
5. Prevention / next steps
6. When to contact an agricultural expert

Important safety rules:

- Do not claim certainty when the information is insufficient.
- Clearly distinguish between observations and possible causes.
- Do not invent pesticide names, doses or application rates.
- If chemical treatment may be needed, advise following
  the product label and local agricultural expert guidance.
- Do not recommend dangerous or excessive chemical use.
- Use the supplied NDVI as an indicator, not proof of a disease.
- Keep the answer concise and useful for a farmer.
"""

       # --------------------------------------------------
    # 8. GEMINI
    # --------------------------------------------------

    try:
        models_to_try = [
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite",
        ]

        response = None
        last_error = None
        MODEL_USED = None

        for model_name in models_to_try:
            for attempt in range(3):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )

                    if response and response.text:
                        break

                except Exception as e:
                    last_error = e
                    error_text = str(e)

                    if "503" in error_text or "429" in error_text:
                        delay = 2 ** attempt

                        print(
                            f"Gemini {model_name} busy. "
                            f"Retry {attempt + 1}/3 in {delay}s..."
                        )

                        time.sleep(delay)
                        continue

                    raise

            if response and response.text:
                MODEL_USED = model_name
                break

        if not response or not response.text:
            raise HTTPException(
                status_code=502,
                detail=f"All Gemini models unavailable: {last_error}",
            )

        advice = response.text.strip()

        if not advice:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty response.",
            )

        return {
            "farm_id": farm.id,
            "farm_name": farm.name,
            "crop": farm.crop,
            "problem": problem,

            "soil_available": soil is not None,

            "satellite_available": ndvi is not None,
            "ndvi": ndvi,
            "satellite_health": satellite_health,

            "advice": advice,

            "language": language,
            "provider": "Google Gemini",
            "model": MODEL_USED,
        }

    except HTTPException:
        raise

    except Exception as e:
        print(
            "Gemini Advisor Error:",
            repr(e),
        )

        raise HTTPException(
            status_code=502,
            detail=f"Gemini error: {str(e)}",
        )