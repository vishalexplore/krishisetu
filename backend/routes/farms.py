from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.cloud import bigquery

from database import get_db
from models.farm import Farm
from schemas import FarmCreate, FarmResponse


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
    db: Session = Depends(get_db),
):
    farm = Farm(
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

    # PostgreSQL → BigQuery
    try:
        sync_farm_to_bigquery(farm)
    except Exception as error:
        print("BigQuery farm sync failed:", error)

    return farm


# --------------------------------------------------
# GET ALL FARMS
# --------------------------------------------------

@router.get("/", response_model=list[FarmResponse])
def get_farms(
    db: Session = Depends(get_db),
):
    return db.query(Farm).order_by(Farm.id.desc()).all()


# --------------------------------------------------
# GET SINGLE FARM
# --------------------------------------------------

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: int,
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()

    if not farm:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    return farm