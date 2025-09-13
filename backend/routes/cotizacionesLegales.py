from fastapi import APIRouter, HTTPException, status
from pymongo.collection import Collection
from bson import ObjectId
from typing import List
from pydantic import BaseModel
from schemas.cotizacionesLegales_schemas import CotizacionLegalSchema, LeySchema

class EstadoUpdate(BaseModel):
    estado: str

def get_routes(collection_leyes: Collection, collection_cotizaciones: Collection) -> APIRouter:
    router = APIRouter()

    # --- Cotizaciones ---

    @router.get("/cotizaciones", response_model=List[CotizacionLegalSchema])
    async def get_all_cotizaciones():
        try:
            cotizaciones = []
            for doc in collection_cotizaciones.find():
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                cotizaciones.append(CotizacionLegalSchema(**doc))
            return cotizaciones
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener cotizaciones: {str(e)}")

    @router.get("/cotizaciones/{id}", response_model=CotizacionLegalSchema)
    async def get_one_cotizacion(id: str):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            cotizacion_doc = collection_cotizaciones.find_one({"_id": ObjectId(id)})
            if not cotizacion_doc:
                raise HTTPException(status_code=404, detail="Cotización no encontrada")
            
            return CotizacionLegalSchema(**cotizacion_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener cotización: {str(e)}")

    @router.delete("/cotizaciones/{id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_cotizacion(id: str):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            result = collection_cotizaciones.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Cotización no encontrada")
            return
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al eliminar cotización: {str(e)}")

    @router.put("/cotizaciones/{id}", response_model=CotizacionLegalSchema)
    async def update_cotizacion(id: str, cotizacion: CotizacionLegalSchema):
        # Verificar si el ID es válido
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="ID inválido")

        # Buscar la cotización existente
        existing_cotizacion = collection_cotizaciones.find_one({"_id": ObjectId(id)})
        if not existing_cotizacion:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")

        # Actualizar los datos
        updated_data = cotizacion.model_dump(by_alias=True, exclude_none=True)
        collection_cotizaciones.update_one({"_id": ObjectId(id)}, {"$set": updated_data})

        # Devolver la cotización actualizada
        updated_doc = collection_cotizaciones.find_one({"_id": ObjectId(id)})
        if updated_doc and "_id" in updated_doc:
            updated_doc["_id"] = str(updated_doc["_id"])
        return CotizacionLegalSchema(**updated_doc)

    @router.patch("/cotizaciones/{id}/estado", response_model=CotizacionLegalSchema)
    async def update_cotizacion_estado(id: str, estado_data: EstadoUpdate):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            # Verificar que el estado sea válido
            if estado_data.estado not in ["pendiente", "entregado"]:
                raise HTTPException(status_code=400, detail="Estado inválido. Debe ser 'pendiente' o 'entregado'")
            
            # Buscar la cotización existente
            existing_cotizacion = collection_cotizaciones.find_one({"_id": ObjectId(id)})
            if not existing_cotizacion:
                raise HTTPException(status_code=404, detail="Cotización no encontrada")
            
            # Actualizar solo el estado
            result = collection_cotizaciones.update_one(
                {"_id": ObjectId(id)}, 
                {"$set": {"estado": estado_data.estado}}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=400, detail="No se pudo actualizar el estado")
            
            # Devolver la cotización actualizada
            updated_doc = collection_cotizaciones.find_one({"_id": ObjectId(id)})
            if updated_doc and "_id" in updated_doc:
                updated_doc["_id"] = str(updated_doc["_id"])
            return CotizacionLegalSchema(**updated_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al actualizar estado: {str(e)}")

    @router.post("/cotizaciones", response_model=CotizacionLegalSchema, status_code=status.HTTP_201_CREATED)
    async def create_cotizacion(cotizacion: CotizacionLegalSchema):
        try:
            cotizacion_dict = cotizacion.model_dump(by_alias=True, exclude_none=True)
            result = collection_cotizaciones.insert_one(cotizacion_dict)
            created_cotizacion = collection_cotizaciones.find_one({"_id": result.inserted_id})
            if created_cotizacion:
                return CotizacionLegalSchema(**created_cotizacion)
            else:
                raise HTTPException(status_code=500, detail="Error al crear la cotización")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al crear cotización: {str(e)}")

    # --- Leyes ---
    @router.get("/leyes", response_model=List[LeySchema])
    async def get_all_leyes():
        try:
            leyes = []
            for doc in collection_leyes.find():
                leyes.append(LeySchema(**doc))
            return leyes
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener leyes: {str(e)}")

    @router.get("/leyes/{id}", response_model=LeySchema)
    async def get_one_ley(id: str):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            ley_doc = collection_leyes.find_one({"_id": ObjectId(id)})
            if not ley_doc:
                raise HTTPException(status_code=404, detail="Ley no encontrada")
            
            return LeySchema(**ley_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener ley: {str(e)}")

    @router.delete("/leyes/{id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_ley(id: str):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            result = collection_leyes.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Ley no encontrada")
            return
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al eliminar ley: {str(e)}")

    @router.put("/leyes/{id}", response_model=LeySchema)
    async def update_ley(id: str, ley: LeySchema):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            # Verificar si existe la ley
            existing_ley = collection_leyes.find_one({"_id": ObjectId(id)})
            if not existing_ley:
                raise HTTPException(status_code=404, detail="Ley no encontrada")

            # Actualizar datos
            updated_data = ley.model_dump(by_alias=True, exclude_unset=True, exclude_none=True)
            collection_leyes.update_one({"_id": ObjectId(id)}, {"$set": updated_data})

            # Devolver la ley actualizada
            updated_doc = collection_leyes.find_one({"_id": ObjectId(id)})
            return LeySchema(**updated_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al actualizar ley: {str(e)}")

    @router.post("/leyes", response_model=LeySchema, status_code=status.HTTP_201_CREATED)
    async def create_ley(ley: LeySchema):
        try:
            ley_dict = ley.model_dump(by_alias=True, exclude_none=True)
            result = collection_leyes.insert_one(ley_dict)
            created_ley = collection_leyes.find_one({"_id": result.inserted_id})
            if created_ley:
                return LeySchema(**created_ley)
            else:
                raise HTTPException(status_code=500, detail="Error al crear la ley")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al crear ley: {str(e)}")

    return router