from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema, handler) -> dict:
        return {"type": "string"}

class EncuadernacionSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    material: str
    tamano: str
    precio: float
    activo: bool = True
    fecha_creacion: datetime = Field(default_factory=datetime.now)
    fecha_actualizacion: datetime = Field(default_factory=datetime.now)
    
    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, datetime: lambda v: v.isoformat()}
    }

class EncuadernacionCreateSchema(BaseModel):
    material: str
    tamano: str
    precio: float
    activo: bool = True

class EncuadernacionUpdateSchema(BaseModel):
    material: Optional[str] = None
    tamano: Optional[str] = None
    precio: Optional[float] = None
    activo: Optional[bool] = None
