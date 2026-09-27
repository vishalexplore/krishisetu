from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.cloud import bigquery

from database import get_db
from models.farm import Farm
from schemas import FarmCreate, FarmResponse
from auth import get_current_user


router = APIRouter(
    prefix="/farms",
    tags=["Farms"],
)


# --------------------------------------------------
# BIGQUERY
# --------------------------------------------------

BQ_PROJECT = "krishisetu-509305"
BQ_DATASET = "krishisetu"

bq_client = bigquery.Client(project=BQ_PROJECT)


def sync_farm_to_bigquery(farm):
    table_id = f"{BQ_PROJECT}.{BQ_DATASET}.farms"

    row = {
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
    }

    query = f"""
        DELETE FROM `{table_id}`
        WHERE id = @farm_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "farm_id",
                "INT64",
                farm.id,
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

    print(f"BigQuery farm synced: {farm.id}")


# --------------------------------------------------
# CREATE FARM
# --------------------------------------------------

@router.post("/", response_model=FarmResponse)
def create_farm(
    farm_data: FarmCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

    farm = Farm(
        firebase_uid=firebase_uid,
        name=farm_data.name,
        crop=farm_data.crop,
        area_acres=farm_data.area_acres,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        sowing_date=farm_data.sowing_date,
    )

    db.add(farm)
    db.commit()
    db.refresh(farm)

    try:
        sync_farm_to_bigquery(farm)
    except Exception as error:
        print("BigQuery farm sync failed:", error)

    return farm


# --------------------------------------------------
# GET MY FARMS
# --------------------------------------------------

@router.get("/", response_model=list[FarmResponse])
def get_farms(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

    return (
        db.query(Farm)
        .filter(Farm.firebase_uid == firebase_uid)
        .order_by(Farm.id.desc())
        .all()
    )


# --------------------------------------------------
# GET MY SINGLE FARM
# --------------------------------------------------

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

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

    return farm