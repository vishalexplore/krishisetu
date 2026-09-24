import json
import os
import re
import time
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models.crop_diagnosis import CropDiagnosis

from google import genai
from google.genai import types
from google.cloud import bigquery


router = APIRouter(
    prefix="/crop-doctor",
    tags=["Crop Doctor"],
)


# ============================================================
# GEMINI CONFIG
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

client = genai.Client(api_key=GEMINI_API_KEY)


# Multiple models + retry
MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
]

MAX_RETRIES = 1


# ============================================================
# BIGQUERY CONFIG
# ============================================================

BQ_PROJECT = "krishisetu-509305"
BQ_DATASET = "krishisetu"

bq_client = bigquery.Client(project=BQ_PROJECT)


def sync_diagnosis_to_bigquery(diagnosis):
    """
    Sync one CropDiagnosis record from PostgreSQL to BigQuery.
    """

    table_id = f"{BQ_PROJECT}.{BQ_DATASET}.crop_diagnoses"

    row = {
        "id": diagnosis.id,
        "farm_id": diagnosis.farm_id,
        "filename": diagnosis.filename,
        "crop": diagnosis.crop,
        "disease": diagnosis.disease,
        "confidence": diagnosis.confidence,
        "symptoms": diagnosis.symptoms,
        "action": diagnosis.action,
        "prevention": diagnosis.prevention,
        "expert_required": diagnosis.expert_required,
        "language": diagnosis.language,
        "provider": diagnosis.provider,
        "model": diagnosis.model,
        "created_at": (
            diagnosis.created_at.isoformat()
            if diagnosis.created_at
            else None
        ),
    }

    # Remove existing record if it already exists
    delete_query = f"""
        DELETE FROM `{table_id}`
        WHERE id = @diagnosis_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "diagnosis_id",
                "INT64",
                diagnosis.id,
            )
        ]
    )

    bq_client.query(
        delete_query,
        job_config=job_config,
    ).result()

    # Insert latest record
    load_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
    )

    bq_client.load_table_from_json(
        [row],
        table_id,
        job_config=load_config,
    ).result()

    print(
        f"BigQuery crop diagnosis synced: {diagnosis.id}"
    )


# ============================================================
# JSON HELPERS
# ============================================================

def clean_json_text(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(
            r"^```(?:json)?",
            "",
            text,
            flags=re.IGNORECASE,
        ).strip()

        text = re.sub(
            r"```$",
            "",
            text,
        ).strip()

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:
        text = text[start:end + 1]

    return text


def safe_string(value, default=""):
    if value is None:
        return default

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, (dict, list)):
        return json.dumps(
            value,
            ensure_ascii=False,
        )

    return str(value)


def safe_list(value):
    if value is None:
        return []

    if isinstance(value, list):
        result = []

        for item in value:
            if isinstance(item, str):
                result.append(item)

            elif isinstance(item, dict):
                result.append(
                    item.get("text")
                    or item.get("symptom")
                    or item.get("description")
                    or json.dumps(
                        item,
                        ensure_ascii=False,
                    )
                )

            else:
                result.append(str(item))

        return result

    if isinstance(value, str):
        return [value]

    return [str(value)]


# ============================================================
# GEMINI VISION
# ============================================================

def generate_with_fallback(
    image_bytes: bytes,
    mime_type: str,
    language: str,
):
    language_name = (
        "Hindi"
        if language == "hi"
        else "English"
    )

    prompt = f"""
You are an expert agricultural crop disease diagnosis assistant.

Analyze the uploaded crop/plant image carefully.

Return ONLY valid JSON.

The response language must be {language_name}.

JSON format:

{{
  "crop": "crop name",
  "disease": "disease or condition name",
  "confidence": 0.0,
  "symptoms": [
    "symptom 1",
    "symptom 2",
    "symptom 3"
  ],
  "action": "what farmer should do now",
  "prevention": "how to prevent the problem",
  "expert_required": "yes"
}}

Rules:
- confidence must be between 0 and 1.
- Do not invent impossible details.
- If the image is unclear, say so.
- Give practical agricultural advice.
- If expert inspection is needed, set expert_required to "yes".
- Do not include markdown.
"""

    last_error = None

    for model_name in MODELS:

        for attempt in range(MAX_RETRIES):

            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type,
                        ),
                        prompt,
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json",
                    ),
                )

                text = response.text or ""

                if not text.strip():
                    raise RuntimeError(
                        "Gemini returned an empty response"
                    )

                return text, model_name

            except Exception as exc:
                last_error = exc
                error_text = str(exc)

                print(
                    f"Gemini error | model={model_name} "
                    f"| attempt={attempt + 1}/{MAX_RETRIES} "
                    f"| {error_text}"
                )

                # Retry temporary Gemini errors
                temporary_error = any(
                    code in error_text
                    for code in [
                        "503",
                        "429",
                        "UNAVAILABLE",
                        "RESOURCE_EXHAUSTED",
                        "DeadlineExceeded",
                        "DEADLINE_EXCEEDED",
                    ]
                )

                if (
                    temporary_error
                    and attempt < MAX_RETRIES - 1
                ):
                    wait_time = 2 ** attempt
                    time.sleep(wait_time)
                    continue

                # Try next model
                break

    raise HTTPException(
        status_code=503,
        detail=(
            "Gemini is temporarily unavailable. "
            "Please try again. "
            f"Last error: {last_error}"
        ),
    )


# ============================================================
# CROP DOCTOR ANALYZE
# ============================================================

@router.post("/analyze")
async def analyze_crop(
    image: UploadFile = File(...),
    language: str = Query("hi"),
    farm_id: int | None = Query(None),
    db: Session = Depends(get_db),
):

    if not image.filename:
        raise HTTPException(
            status_code=400,
            detail="Image file is required",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPEG, PNG and WEBP "
                "images are supported"
            ),
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty",
        )

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 10 MB",
        )

    try:

        # ----------------------------------------------------
        # Gemini Vision
        # ----------------------------------------------------

        raw_response, model_name = generate_with_fallback(
            image_bytes=image_bytes,
            mime_type=image.content_type,
            language=language,
        )

        cleaned = clean_json_text(raw_response)

        try:
            result = json.loads(cleaned)

        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Gemini returned invalid JSON. "
                    "Please try again."
                ),
            )

        # ----------------------------------------------------
        # Normalize AI result
        # ----------------------------------------------------

        crop = safe_string(
            result.get("crop"),
            "Unknown",
        )

        disease = safe_string(
            result.get("disease"),
            "Unknown",
        )

        action = safe_string(
            result.get("action"),
            "Please consult an agricultural expert.",
        )

        prevention = safe_string(
            result.get("prevention"),
            "Follow proper crop management practices.",
        )

        confidence = result.get(
            "confidence",
            0,
        )

        try:
            confidence = float(confidence)

        except (TypeError, ValueError):
            confidence = 0

        confidence = max(
            0.0,
            min(1.0, confidence),
        )

        symptoms = safe_list(
            result.get("symptoms")
        )

        expert_required = safe_string(
            result.get("expert_required"),
            "yes",
        ).lower()

        # ----------------------------------------------------
        # Save PostgreSQL
        # ----------------------------------------------------

        diagnosis = CropDiagnosis(
            farm_id=farm_id,
            filename=image.filename,
            crop=crop,
            disease=disease,
            confidence=confidence,
            symptoms=json.dumps(
                symptoms,
                ensure_ascii=False,
            ),
            action=action,
            prevention=prevention,
            expert_required=expert_required,
            language=language,
            provider="Google Gemini",
            model=model_name,
        )

        db.add(diagnosis)
        db.commit()
        db.refresh(diagnosis)

        # ----------------------------------------------------
        # Sync PostgreSQL → BigQuery
        # ----------------------------------------------------

        try:
            sync_diagnosis_to_bigquery(
                diagnosis
            )

        except Exception as error:
            # BigQuery failure should NOT break
            # the Crop Doctor result.
            print(
                "BigQuery crop diagnosis sync failed:",
                error,
            )

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {
            "id": diagnosis.id,
            "farm_id": diagnosis.farm_id,
            "filename": diagnosis.filename,
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "symptoms": symptoms,
            "action": action,
            "prevention": prevention,
            "expert_required": expert_required,
            "language": language,
            "provider": "Google Gemini",
            "model": model_name,
            "created_at": diagnosis.created_at,
            "disclaimer": (
                "This AI diagnosis is for guidance only. "
                "For serious crop damage, consult an "
                "agricultural expert."
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        print(
            "Crop Doctor unexpected error:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=f"Crop Doctor error: {str(exc)}",
        )


# ============================================================
# CROP DOCTOR HISTORY
# ============================================================

@router.get("/history")
def crop_diagnosis_history(
    farm_id: int | None = Query(None),
    limit: int = Query(
        10,
        ge=1,
        le=50,
    ),
    db: Session = Depends(get_db),
):

    query = db.query(CropDiagnosis)

    if farm_id is not None:
        query = query.filter(
            CropDiagnosis.farm_id == farm_id
        )

    records = (
        query
        .order_by(CropDiagnosis.id.desc())
        .limit(limit)
        .all()
    )

    history = []

    for item in records:

        try:
            symptoms = (
                json.loads(item.symptoms)
                if item.symptoms
                else []
            )

        except Exception:
            symptoms = safe_list(
                item.symptoms
            )

        history.append(
            {
                "id": item.id,
                "farm_id": item.farm_id,
                "filename": item.filename,
                "crop": item.crop,
                "disease": item.disease,
                "confidence": item.confidence,
                "symptoms": symptoms,
                "action": item.action,
                "prevention": item.prevention,
                "expert_required": item.expert_required,
                "language": item.language,
                "provider": item.provider,
                "model": item.model,
                "created_at": item.created_at,
            }
        )

    return {
        "count": len(history),
        "history": history,
    }