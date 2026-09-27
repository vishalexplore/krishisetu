from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models.farm import Farm
from models.profile import Profile
from models.user_activity import UserActivity
from firebase_admin import auth as firebase_auth


router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: dict = Depends(get_current_user)):
    # Set ADMIN_EMAIL in Render/local environment to your own Firebase login email.
    import os

    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    user_email = (current_user.get("email") or "").strip().lower()

    if not admin_email or user_email != admin_email:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


@router.post("/activity")
def record_activity(
    action: str = "active",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    action = action if action in {"login", "active"} else "active"

    row = UserActivity(
        firebase_uid=current_user["uid"],
        email=current_user.get("email"),
        action=action,
    )
    db.add(row)
    db.commit()

    return {"ok": True}


@router.get("/stats")
def get_admin_stats(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    def unique_since(hours):
        since = now - timedelta(hours=hours)
        return (
            db.query(func.count(func.distinct(UserActivity.firebase_uid)))
            .filter(UserActivity.created_at >= since)
            .scalar()
            or 0
        )

    active_15m = unique_since(0.25)
    active_24h = unique_since(24)
    active_7d = unique_since(24 * 7)

    today_logins = (
        db.query(func.count(UserActivity.id))
        .filter(
            UserActivity.action == "login",
            UserActivity.created_at >= today_start,
        )
        .scalar()
        or 0
    )

    total_farms = db.query(func.count(Farm.id)).scalar() or 0

    # Firebase Auth is the source of truth for registered accounts.
    total_users = 0
    page = firebase_auth.list_users()
    while page:
        total_users += len(page.users)
        if not page.page_token:
            break
        page = firebase_auth.list_users(page_token=page.page_token)

    last_seen_subquery = (
        db.query(
            UserActivity.firebase_uid,
            func.max(UserActivity.created_at).label("last_seen"),
        )
        .group_by(UserActivity.firebase_uid)
        .subquery()
    )

    farm_counts = (
        db.query(
            Farm.firebase_uid,
            func.count(Farm.id).label("farm_count"),
        )
        .filter(Farm.firebase_uid.isnot(None))
        .group_by(Farm.firebase_uid)
        .all()
    )
    farm_map = {uid: count for uid, count in farm_counts}

    profiles = db.query(Profile).all()
    profile_map = {p.firebase_uid: p for p in profiles}

    users = []
    for uid, last_seen in db.query(
        UserActivity.firebase_uid,
        func.max(UserActivity.created_at),
    ).group_by(UserActivity.firebase_uid).all():
        profile = profile_map.get(uid)
        users.append({
            "uid": uid,
            "email": profile.email if profile else None,
            "name": profile.name if profile else "Farmer",
            "farm_count": farm_map.get(uid, 0),
            "last_seen": last_seen.isoformat() if last_seen else None,
        })

    users.sort(key=lambda x: x["last_seen"] or "", reverse=True)

    return {
        "total_users": total_users,
        "active_users": active_15m,
        "recently_active": active_24h,
        "today_logins": today_logins,
        "daily_active": active_24h,
        "weekly_active": active_7d,
        "total_farms": total_farms,
        "users": users,
    }
