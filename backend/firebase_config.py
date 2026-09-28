import json
import os

import firebase_admin
from firebase_admin import credentials


if not firebase_admin._apps:
    service_account_file = os.path.join(
        os.path.dirname(__file__),
        "firebase-service-account.json",
    )

    if not os.path.exists(service_account_file):
        raise RuntimeError(
            "firebase-service-account.json not found"
        )

    with open(service_account_file, "r", encoding="utf-8") as file:
        service_account_info = json.load(file)

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