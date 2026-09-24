from datetime import datetime

from google.cloud import bigquery
from sqlalchemy.orm import Session

from database import SessionLocal
from models.farm import Farm
from models.soil import SoilTest
from models.crop_diagnosis import CropDiagnosis


PROJECT_ID = "krishisetu-509305"
DATASET_ID = "krishisetu"

client = bigquery.Client(project=PROJECT_ID)


def load_table(table_name, rows, schema):
    table_id = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"

    table = bigquery.Table(table_id, schema=schema)

    try:
        client.get_table(table_id)
        print(f"Table exists: {table_id}")
    except Exception:
        table = client.create_table(table)
        print(f"Created table: {table_id}")

    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )

    job = client.load_table_from_json(
        rows,
        table_id,
        job_config=job_config,
    )

    job.result()

    print(f"Synced {len(rows)} rows → {table_name}")


def sync_farms(db: Session):
    farms = db.query(Farm).all()

    rows = []

    for farm in farms:
        rows.append({
            "id": farm.id,
            "name": farm.name,
            "crop": farm.crop,
            "area_acres": farm.area_acres,
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "sowing_date": (
                farm.sowing_date.isoformat()
                if farm.sowing_date
                else None
            ),
        })

    schema = [
        bigquery.SchemaField("id", "INT64"),
        bigquery.SchemaField("name", "STRING"),
        bigquery.SchemaField("crop", "STRING"),
        bigquery.SchemaField("area_acres", "FLOAT64"),
        bigquery.SchemaField("latitude", "FLOAT64"),
        bigquery.SchemaField("longitude", "FLOAT64"),
        bigquery.SchemaField("sowing_date", "DATE"),
    ]

    load_table("farms", rows, schema)


def sync_soil_tests(db: Session):
    tests = db.query(SoilTest).all()

    rows = []

    for test in tests:
        rows.append({
            "id": test.id,
            "farm_id": test.farm_id,
            "ph": test.ph,
            "moisture": test.moisture,
            "nitrogen": test.nitrogen,
            "phosphorus": test.phosphorus,
            "potassium": test.potassium,
            "organic_carbon": test.organic_carbon,
            "created_at": (
                test.created_at.isoformat()
                if test.created_at
                else None
            ),
        })

    schema = [
        bigquery.SchemaField("id", "INT64"),
        bigquery.SchemaField("farm_id", "INT64"),
        bigquery.SchemaField("ph", "FLOAT64"),
        bigquery.SchemaField("moisture", "FLOAT64"),
        bigquery.SchemaField("nitrogen", "FLOAT64"),
        bigquery.SchemaField("phosphorus", "FLOAT64"),
        bigquery.SchemaField("potassium", "FLOAT64"),
        bigquery.SchemaField("organic_carbon", "FLOAT64"),
        bigquery.SchemaField("created_at", "TIMESTAMP"),
    ]

    load_table("soil_tests", rows, schema)


def sync_crop_diagnoses(db: Session):
    diagnoses = db.query(CropDiagnosis).all()

    rows = []

    for diagnosis in diagnoses:
        rows.append({
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
        })

    schema = [
        bigquery.SchemaField("id", "INT64"),
        bigquery.SchemaField("farm_id", "INT64"),
        bigquery.SchemaField("filename", "STRING"),
        bigquery.SchemaField("crop", "STRING"),
        bigquery.SchemaField("disease", "STRING"),
        bigquery.SchemaField("confidence", "FLOAT64"),
        bigquery.SchemaField("symptoms", "STRING"),
        bigquery.SchemaField("action", "STRING"),
        bigquery.SchemaField("prevention", "STRING"),
        bigquery.SchemaField("expert_required", "STRING"),
        bigquery.SchemaField("language", "STRING"),
        bigquery.SchemaField("provider", "STRING"),
        bigquery.SchemaField("model", "STRING"),
        bigquery.SchemaField("created_at", "TIMESTAMP"),
    ]

    load_table("crop_diagnoses", rows, schema)


def main():
    print("\n==============================")
    print("KrishiSetu BigQuery Sync")
    print("==============================\n")

    db = SessionLocal()

    try:
        sync_farms(db)
        sync_soil_tests(db)
        sync_crop_diagnoses(db)

        print("\n✅ BIGQUERY SYNC COMPLETED")
        print("Project:", PROJECT_ID)
        print("Dataset:", DATASET_ID)

    finally:
        db.close()


if __name__ == "__main__":
    main()