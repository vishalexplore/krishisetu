from datetime import datetime, timedelta
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models.farm import Farm
from models.profile import Profile
from models.user_activity import UserActivity

from firebase_admin import auth as firebase_auth


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


def require_admin(
    current_user: dict = Depends(get_current_user),
):
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    user_email = (
        current_user.get("email") or ""
    ).strip().lower()

    if not admin_email:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_EMAIL is not configured",
        )

    if user_email != admin_email:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


@router.post("/activity")
def record_activity(
    action: str = "active",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    action = (
        action
        if action in {"login", "active"}
        else "active"
    )

    row = UserActivity(
        firebase_uid=current_user["uid"],
        email=current_user.get("email"),
        action=action,
    )

    db.add(row)
    db.commit()

    return {
        "ok": True,
        "action": action,
    }


@router.get("/stats")
def get_admin_stats(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    today_start = datetime(
        now.year,
        now.month,
        now.day,
    )

    def unique_users_since(hours: float):
        since = now - timedelta(hours=hours)

        return (
            db.query(
                func.count(
                    func.distinct(
                        UserActivity.firebase_uid
                    )
                )
            )
            .filter(
                UserActivity.created_at >= since
            )
            .scalar()
            or 0
        )

    # Active users
    active_users = unique_users_since(0.25)
    recently_active = unique_users_since(24)
    weekly_active = unique_users_since(24 * 7)

    # Today's login events
    today_logins = (
        db.query(func.count(UserActivity.id))
        .filter(
            UserActivity.action == "login",
            UserActivity.created_at >= today_start,
        )
        .scalar()
        or 0
    )

    # Total farms
    total_farms = (
        db.query(func.count(Farm.id))
        .scalar()
        or 0
    )

    # ---------------------------------
    # Firebase registered users
    # ---------------------------------

    total_users = 0

    page = firebase_auth.list_users()

    while page:
        total_users += len(page.users)
        page = page.get_next_page()

    # ---------------------------------
    # Farm count per Firebase user
    # ---------------------------------

    farm_counts = (
        db.query(
            Farm.firebase_uid,
            func.count(Farm.id).label("farm_count"),
        )
        .filter(
            Farm.firebase_uid.isnot(None)
        )
        .group_by(Farm.firebase_uid)
        .all()
    )

    farm_map = {
        uid: count
        for uid, count in farm_counts
    }

    # ---------------------------------
    # Profiles
    # ---------------------------------

    profiles = db.query(Profile).all()

    profile_map = {
        profile.firebase_uid: profile
        for profile in profiles
    }

    # ---------------------------------
    # Last activity per user
    # ---------------------------------

    activity_rows = (
        db.query(
            UserActivity.firebase_uid,
            func.max(
                UserActivity.created_at
            ).label("last_seen"),
        )
        .group_by(
            UserActivity.firebase_uid
        )
        .all()
    )

    users = []

    for uid, last_seen in activity_rows:
        profile = profile_map.get(uid)

        users.append(
            {
                "uid": uid,
                "email": (
                    profile.email
                    if profile
                    else None
                ),
                "name": (
                    profile.name
                    if profile
                    else "Farmer"
                ),
                "farm_count": farm_map.get(
                    uid,
                    0,
                ),
                "last_seen": (
                    last_seen.isoformat()
                    if last_seen
                    else None
                ),
            }
        )

    # Latest active users first
    users.sort(
        key=lambda user: user["last_seen"] or "",
        reverse=True,
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "recently_active": recently_active,
        "today_logins": today_logins,
        "daily_active": recently_active,
        "weekly_active": weekly_active,
        "total_farms": total_farms,
        "users": users,
    }