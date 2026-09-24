from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database import Base


class CropDiagnosis(Base):
    __tablename__ = "crop_diagnoses"

    id = Column(Integer, primary_key=True, index=True)

    farm_id = Column(Integer, nullable=True, index=True)

    filename = Column(String(255), nullable=True)

    crop = Column(String(100), nullable=True)
    disease = Column(String(255), nullable=True)

    confidence = Column(Float, nullable=True)

    symptoms = Column(Text, nullable=True)
    action = Column(Text, nullable=True)
    prevention = Column(Text, nullable=True)

    expert_required = Column(String(10), nullable=True)

    language = Column(String(10), default="hi")
    provider = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )