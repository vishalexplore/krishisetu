from datetime import datetime, timedelta

import ee
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.farm import Farm

router = APIRouter(prefix="/satellite", tags=["Satellite"])

PROJECT_ID = "krishisetu-509305"

# Earth Engine uses the ADC credentials configured earlier.
ee.Initialize(project=PROJECT_ID)


def mask_s2_clouds(image):
    qa = image.select("QA60")

    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11

    mask = (
        qa.bitwiseAnd(cloud_bit_mask).eq(0)
        .And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
    )

    return image.updateMask(mask)


def get_ndvi_tile_url(latitude: float, longitude: float, days: int = 60):
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    region = ee.Geometry.Point(
        [longitude, latitude]
    ).buffer(100)

    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate(
            str(start_date),
            str(end_date + timedelta(days=1)),
        )
        .filter(
            ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40)
        )
        .map(mask_s2_clouds)
    )

    image_count = collection.size().getInfo()

    if image_count == 0:
        return None

    composite = collection.median()

    ndvi = composite.normalizedDifference(
        ["B8", "B4"]
    ).rename("NDVI")

    ndvi_visualized = ndvi.visualize(
        min=-0.2,
        max=0.8,
        palette=[
            "8B0000",
            "FF8C00",
            "FFFF00",
            "ADFF2F",
            "00A000",
            "006400",
        ],
    )

    map_id = ndvi_visualized.getMapId()

    return {
        "tile_url": map_id["tile_fetcher"].url_format,
        "image_count": image_count,
    }


@router.get("/farm/{farm_id}")
def satellite_farm_data(
    farm_id: int,
    days: int = Query(60, ge=7, le=180),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()

    if not farm:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    if farm.latitude is None or farm.longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Farm does not have valid GPS coordinates",
        )

    try:
        latitude = float(farm.latitude)
        longitude = float(farm.longitude)

        region = ee.Geometry.Point(
            [longitude, latitude]
        ).buffer(100)

        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate(
                str(start_date),
                str(end_date + timedelta(days=1)),
            )
            .filter(
                ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40)
            )
            .map(mask_s2_clouds)
        )

        image_count = collection.size().getInfo()

        if image_count == 0:
            return {
                "farm_id": farm.id,
                "farm_name": farm.name,
                "crop": farm.crop,
                "latitude": latitude,
                "longitude": longitude,
                "analysis_available": False,
                "message": (
                    "No suitable Sentinel-2 image was found "
                    "for this farm in the selected period."
                ),
                "days_checked": days,
                "image_count": 0,
                "provider": "Google Earth Engine",
                "dataset": "Sentinel-2 SR Harmonized",
            }

        latest_image = collection.sort(
            "system:time_start",
            False,
        ).first()

        latest_date = ee.Date(
            latest_image.get("system:time_start")
        ).format("YYYY-MM-dd").getInfo()

        composite = collection.median()

        ndvi = composite.normalizedDifference(
            ["B8", "B4"]
        ).rename("NDVI")

        stats = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=10,
            maxPixels=100000,
        ).getInfo()

        ndvi_value = stats.get("NDVI")

        if ndvi_value is None:
            return {
                "farm_id": farm.id,
                "farm_name": farm.name,
                "crop": farm.crop,
                "latitude": latitude,
                "longitude": longitude,
                "analysis_available": False,
                "message": "NDVI could not be calculated for this area.",
                "image_count": image_count,
                "provider": "Google Earth Engine",
                "dataset": "Sentinel-2 SR Harmonized",
            }

        ndvi_value = round(float(ndvi_value), 3)

        if ndvi_value >= 0.60:
            health = "Healthy"
        elif ndvi_value >= 0.35:
            health = "Moderate"
        elif ndvi_value >= 0.15:
            health = "Stressed"
        else:
            health = "Very Low Vegetation"

        tile_data = get_ndvi_tile_url(
            latitude,
            longitude,
            days,
        )

        return {
            "farm_id": farm.id,
            "farm_name": farm.name,
            "crop": farm.crop,
            "latitude": latitude,
            "longitude": longitude,
            "analysis_available": True,
            "ndvi": ndvi_value,
            "health": health,
            "latest_image_date": latest_date,
            "image_count": image_count,
            "days_checked": days,
            "provider": "Google Earth Engine",
            "dataset": "COPERNICUS/S2_SR_HARMONIZED",
            "resolution_meters": 10,
            "ndvi_tile_url": (
                tile_data["tile_url"]
                if tile_data
                else None
            ),
            "message": "Real Sentinel-2 NDVI analysis completed.",
        }

    except Exception as e:
        print(
            "Earth Engine Satellite Error:",
            repr(e),
        )

        raise HTTPException(
            status_code=502,
            detail=f"Earth Engine error: {str(e)}",
        )