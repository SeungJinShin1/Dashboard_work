import firebase_admin
from firebase_admin import credentials, firestore
import os

class FirebaseService:
    def __init__(self):
        # Check if already initialized to avoid errors on reload
        if not firebase_admin._apps:
            # In production, use environment variables or a secure path
            # For local dev, we might assume serviceAccountKey.json is in root or use mock
            
            # Check for credential JSON content (for Vercel/Cloud env)
            cred_json = os.getenv("FIREBASE_CREDENTIALS")
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            
            if cred_json:
                import json
                try:
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("Firebase initialized with JSON credentials.")
                except Exception as e:
                    print(f"Failed to parse FIREBASE_CREDENTIALS: {e}")
            elif cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"Firebase initialized with credentials from {cred_path}")
            else:
                print("Warning: FIREBASE_CREDENTIALS or PATH not set. Using default.")
                try:
                    firebase_admin.initialize_app()
                except Exception as e:
                     print(f"Failed to initialize Firebase Default: {e}")

        try:
            self.db = firestore.client()
        except Exception as e:
            print(f"Firestore client init failed: {e}")
            self.db = None

db_service = FirebaseService()

def get_db():
    return db_service.db
