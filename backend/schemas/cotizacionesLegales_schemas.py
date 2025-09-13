from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
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

class ClienteSchema(BaseModel):
    nombre: str
    email: EmailStr

class FechaSchema(BaseModel):
    fecha_completa: str
    timestamp: datetime

class LeySeleccionadaSchema(BaseModel):
    nombre: str
    grosor: str
    precio: float

class LeyesSeleccionadasSchema(BaseModel):
    cantidad: int
    items: List[LeySeleccionadaSchema]
    subtotal: float

class VolumenSchema(BaseModel):
    numero: int
    leyes: str

class TipoEncuadernacionSchema(BaseModel):
    material: str
    tamano: str
    precio: float

class CostoEncuadernacionSchema(BaseModel):
    cantidad: int
    costo_unitario: float
    total: float
    tipo_encuadernacion: Optional[TipoEncuadernacionSchema] = None

class AgrupamientoVolumenesSchema(BaseModel):
    cantidad_volumenes: int
    volumenes: List[VolumenSchema]
    costo_encuadernacion: CostoEncuadernacionSchema

class ResumenCostoSchema(BaseModel):
    subtotal_leyes: float
    costo_encuadernacion: float
    total: float

class OpcionPagoSchema(BaseModel):
    tipo: str
    valor_cuota: float
    cantidad_cuotas: int

class CotizacionLegalSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    cliente: ClienteSchema
    fecha: FechaSchema
    leyes_seleccionadas: LeyesSeleccionadasSchema
    agrupamiento_volumenes: AgrupamientoVolumenesSchema
    resumen_costo: ResumenCostoSchema
    opcion_pago: OpcionPagoSchema
    fecha_creacion: datetime
    estado: str

    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, datetime: lambda v: v.isoformat()}
    }

class LeySchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    nombre: str
    precio: float
    categoria: str
    grosor: str
    fecha_actualizacion: datetime

    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, datetime: lambda v: v.isoformat()}
    }

