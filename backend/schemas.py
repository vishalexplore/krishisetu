from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class FarmCreate(BaseModel):
    name: str
    crop: str
    area_acres: float
    latitude: float
    longitude: float
    sowing_date: date | None = None


class FarmResponse(FarmCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)