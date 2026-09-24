from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.profile import Profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/")
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).order_by(Profile.id.asc()).first()

    if not profile:
        profile = Profile(
            name="Farmer",
            state="Uttar Pradesh",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


@router.put("/")
def update_profile(
    name: str = "Farmer",
    mobile: str | None = None,
    village: str | None = None,
    district: str | None = None,
    state: str | None = "Uttar Pradesh",
    email: str | None = None,
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).order_by(Profile.id.asc()).first()

    if not profile:
        profile = Profile()
        db.add(profile)

    profile.name = name
    profile.mobile = mobile
    profile.village = village
    profile.district = district
    profile.state = state
    profile.email = email

    db.commit()
    db.refresh(profile)

    return profile