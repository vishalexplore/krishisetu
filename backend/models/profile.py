from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False, default="Farmer")
    mobile = Column(String(20), nullable=True)
    village = Column(String(150), nullable=True)
    district = Column(String(150), nullable=True)
    state = Column(String(150), nullable=True, default="Uttar Pradesh")
    email = Column(String(255), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )