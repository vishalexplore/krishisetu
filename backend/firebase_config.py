import json
import os

import firebase_admin
from firebase_admin import credentials


if not firebase_admin._apps:
    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if not firebase_json:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON environment variable not found"
        )

    try:
        service_account_info = json.loads(firebase_json)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON"
        ) from error

    if service_account_info.get("project_id") != "krishisetu-ecee4":
        raise RuntimeError(
            f"Wrong Firebase project: "
            f"{service_account_info.get('project_id')}"
        )

    cred = credentials.Certificate(service_account_info)

    firebase_admin.initialize_app(
        cred,
        {
            "projectId": "krishisetu-ecee4",
        },
    )

    print("Firebase Admin initialized: krishisetu-ecee4")