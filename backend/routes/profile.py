from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.profile import Profile
from auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/")
def get_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

    profile = (
        db.query(Profile)
        .filter(Profile.firebase_uid == firebase_uid)
        .first()
    )

    if not profile:
        profile = Profile(
            firebase_uid=firebase_uid,
            name="Farmer",
            state="Uttar Pradesh",
            email=current_user.get("email"),
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
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = current_user["uid"]

    profile = (
        db.query(Profile)
        .filter(Profile.firebase_uid == firebase_uid)
        .first()
    )

    if not profile:
        profile = Profile(
            firebase_uid=firebase_uid,
        )
        db.add(profile)

    profile.name = name
    profile.mobile = mobile
    profile.village = village
    profile.district = district
    profile.state = state
    profile.email = email or current_user.get("email")

    db.commit()
    db.refresh(profile)

    return profile