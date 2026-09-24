from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class SoilTest(Base):
    __tablename__ = "soil_tests"

    id = Column(Integer, primary_key=True, index=True)

    farm_id = Column(Integer, nullable=False, index=True)

    ph = Column(Float, nullable=True)
    moisture = Column(Float, nullable=True)

    nitrogen = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)

    organic_carbon = Column(Float, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )