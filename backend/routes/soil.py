from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.cloud import bigquery

from database import get_db
from models.soil import SoilTest
from models.farm import Farm
from auth import get_current_user


router = APIRouter(prefix="/soil", tags=["Soil"])


BQ_PROJECT = "krishisetu-509305"
BQ_DATASET = "krishisetu"

bq_client = bigquery.Client(project=BQ_PROJECT)


def sync_soil_to_bigquery(soil_test):
    table_id = f"{BQ_PROJECT}.{BQ_DATASET}.soil_tests"

    row = {
        "id": soil_test.id,
        "farm_id": soil_test.farm_id,
        "ph": soil_test.ph,
        "moisture": soil_test.moisture,
        "nitrogen": soil_test.nitrogen,
        "phosphorus": soil_test.phosphorus,
        "potassium": soil_test.potassium,
        "organic_carbon": soil_test.organic_carbon,
        "created_at": (
            soil_test.created_at.isoformat()
            if soil_test.created_at
            else None
        ),
    }

    query = f"""
        DELETE FROM `{table_id}`
        WHERE id = @soil_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "soil_id",
                "INT64",
                soil_test.id,
            )
        ]
    )

    bq_client.query(
        query,
        job_config=job_config,
    ).result()

    load_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
    )

    bq_client.load_table_from_json(
        [row],
        table_id,
        job_config=load_config,
    ).result()

    print(f"BigQuery soil synced: {soil_test.id}")


@router.post("/")
def create_soil_test(
    farm_id: int,
    ph: float | None = None,
    moisture: float | None = None,
    nitrogen: float | None = None,
    phosphorus: float | None = None,
    potassium: float | None = None,
    organic_carbon: float | None = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

    # Check that this farm belongs to the logged-in user
    farm = (
        db.query(Farm)
        .filter(
            Farm.id == farm_id,
            Farm.firebase_uid == firebase_uid,
        )
        .first()
    )

    if not farm:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    soil_test = SoilTest(
        farm_id=farm_id,
        ph=ph,
        moisture=moisture,
        nitrogen=nitrogen,
        phosphorus=phosphorus,
        potassium=potassium,
        organic_carbon=organic_carbon,
    )

    db.add(soil_test)
    db.commit()
    db.refresh(soil_test)

    try:
        sync_soil_to_bigquery(soil_test)
    except Exception as error:
        print("BigQuery soil sync failed:", error)

    return soil_test


@router.get("/{farm_id}")
def get_soil_test(
    farm_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

    # Check that this farm belongs to the logged-in user
    farm = (
        db.query(Farm)
        .filter(
            Farm.id == farm_id,
            Farm.firebase_uid == firebase_uid,
        )
        .first()
    )

    if not farm:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    soil_test = (
        db.query(SoilTest)
        .filter(SoilTest.farm_id == farm_id)
        .order_by(SoilTest.id.desc())
        .first()
    )

    if not soil_test:
        raise HTTPException(
            status_code=404,
            detail="No soil test data found for this farm",
        )

    return soil_test