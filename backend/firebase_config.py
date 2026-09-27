import json
import os

import firebase_admin
from firebase_admin import credentials


if not firebase_admin._apps:
    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if firebase_json:
        try:
            service_account_info = json.loads(firebase_json)

            cred = credentials.Certificate(service_account_info)

            firebase_admin.initialize_app(cred)

        except Exception as error:
            print("Firebase Admin initialization failed:", error)
            raise

    else:
        # Local development fallback
        firebase_admin.initialize_app()