import firebase_config

from fastapi import Header, HTTPException
from firebase_admin import auth


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format"
        )

    token = authorization.split("Bearer ", 1)[1]

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token

    except Exception as error:
        print(
            "FIREBASE VERIFY ERROR:",
            type(error).__name__,
            str(error)
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )