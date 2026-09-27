from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), index=True, nullable=False)
    email = Column(String(255), nullable=True)
    action = Column(String(30), nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
