from fastapi import APIRouter, HTTPException, status
from pymongo.collection import Collection
from bson import ObjectId
from typing import List
from datetime import datetime
from schemas.encuadernacion_schemas import (
    EncuadernacionSchema, 
    EncuadernacionCreateSchema, 
    EncuadernacionUpdateSchema
)

def get_encuadernacion_routes(collection_encuadernacion: Collection) -> APIRouter:
    router = APIRouter()

    # --- Encuadernación CRUD ---

    @router.get("/encuadernacion", response_model=List[EncuadernacionSchema])
    async def get_all_encuadernacion():
        """Obtener todos los tipos de encuadernación"""
        try:
            encuadernaciones = []
            for doc in collection_encuadernacion.find({"activo": True}).sort("material", 1):
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                encuadernaciones.append(EncuadernacionSchema(**doc))
            return encuadernaciones
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener encuadernaciones: {str(e)}")

    @router.get("/encuadernacion/admin", response_model=List[EncuadernacionSchema])
    async def get_all_encuadernacion_admin():
        """Obtener todos los tipos de encuadernación (incluyendo inactivos) para admin"""
        try:
            encuadernaciones = []
            for doc in collection_encuadernacion.find().sort("material", 1):
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                encuadernaciones.append(EncuadernacionSchema(**doc))
            return encuadernaciones
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener encuadernaciones: {str(e)}")

    @router.get("/encuadernacion/{id}", response_model=EncuadernacionSchema)
    async def get_one_encuadernacion(id: str):
        """Obtener una encuadernación por ID"""
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            encuadernacion_doc = collection_encuadernacion.find_one({"_id": ObjectId(id)})
            if not encuadernacion_doc:
                raise HTTPException(status_code=404, detail="Encuadernación no encontrada")
            
            encuadernacion_doc["_id"] = str(encuadernacion_doc["_id"])
            return EncuadernacionSchema(**encuadernacion_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al obtener encuadernación: {str(e)}")

    @router.post("/encuadernacion", response_model=EncuadernacionSchema, status_code=status.HTTP_201_CREATED)
    async def create_encuadernacion(encuadernacion: EncuadernacionCreateSchema):
        """Crear nueva encuadernación"""
        try:
            # Verificar si ya existe una encuadernación con el mismo material y tamaño
            existing = collection_encuadernacion.find_one({
                "material": encuadernacion.material,
                "tamano": encuadernacion.tamano,
                "activo": True
            })
            
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Ya existe una encuadernación activa con material '{encuadernacion.material}' y tamaño '{encuadernacion.tamano}'"
                )

            encuadernacion_dict = encuadernacion.model_dump()
            encuadernacion_dict["fecha_creacion"] = datetime.now()
            encuadernacion_dict["fecha_actualizacion"] = datetime.now()
            
            result = collection_encuadernacion.insert_one(encuadernacion_dict)
            
            # Obtener el documento creado
            created_doc = collection_encuadernacion.find_one({"_id": result.inserted_id})
            created_doc["_id"] = str(created_doc["_id"])
            
            return EncuadernacionSchema(**created_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al crear encuadernación: {str(e)}")

    @router.put("/encuadernacion/{id}", response_model=EncuadernacionSchema)
    async def update_encuadernacion(id: str, encuadernacion: EncuadernacionUpdateSchema):
        """Actualizar encuadernación existente"""
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            # Verificar que la encuadernación existe
            existing_doc = collection_encuadernacion.find_one({"_id": ObjectId(id)})
            if not existing_doc:
                raise HTTPException(status_code=404, detail="Encuadernación no encontrada")
            
            # Preparar datos de actualización
            update_data = {}
            for field, value in encuadernacion.model_dump(exclude_unset=True).items():
                if value is not None:
                    update_data[field] = value
            
            if update_data:
                update_data["fecha_actualizacion"] = datetime.now()
                
                # Si se está actualizando material o tamaño, verificar duplicados
                if "material" in update_data or "tamano" in update_data:
                    new_material = update_data.get("material", existing_doc["material"])
                    new_tamano = update_data.get("tamano", existing_doc["tamano"])
                    
                    duplicate = collection_encuadernacion.find_one({
                        "material": new_material,
                        "tamano": new_tamano,
                        "activo": True,
                        "_id": {"$ne": ObjectId(id)}
                    })
                    
                    if duplicate:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Ya existe otra encuadernación activa con material '{new_material}' y tamaño '{new_tamano}'"
                        )
                
                collection_encuadernacion.update_one(
                    {"_id": ObjectId(id)},
                    {"$set": update_data}
                )
            
            # Obtener el documento actualizado
            updated_doc = collection_encuadernacion.find_one({"_id": ObjectId(id)})
            updated_doc["_id"] = str(updated_doc["_id"])
            
            return EncuadernacionSchema(**updated_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al actualizar encuadernación: {str(e)}")

    @router.delete("/encuadernacion/{id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_encuadernacion(id: str):
        """Eliminar encuadernación de la base de datos"""
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            # Verificar que la encuadernación existe
            if not collection_encuadernacion.find_one({"_id": ObjectId(id)}):
                raise HTTPException(status_code=404, detail="Encuadernación no encontrada")
            
            # Eliminar el documento
            result = collection_encuadernacion.delete_one({"_id": ObjectId(id)})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="No se pudo eliminar la encuadernación")
            
            return
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al eliminar encuadernación: {str(e)}")

    @router.patch("/encuadernacion/{id}/toggle", response_model=EncuadernacionSchema)
    async def toggle_encuadernacion_status(id: str):
        """Alternar estado activo/inactivo de una encuadernación"""
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            # Obtener el documento actual
            current_doc = collection_encuadernacion.find_one({"_id": ObjectId(id)})
            if not current_doc:
                raise HTTPException(status_code=404, detail="Encuadernación no encontrada")
            
            new_status = not current_doc.get("activo", True)
            
            # Si se está activando, verificar duplicados
            if new_status:
                duplicate = collection_encuadernacion.find_one({
                    "material": current_doc["material"],
                    "tamano": current_doc["tamano"],
                    "activo": True,
                    "_id": {"$ne": ObjectId(id)}
                })
                
                if duplicate:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ya existe otra encuadernación activa con material '{current_doc['material']}' y tamaño '{current_doc['tamano']}'"
                    )
            
            collection_encuadernacion.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"activo": new_status, "fecha_actualizacion": datetime.now()}}
            )
            
            # Obtener el documento actualizado
            updated_doc = collection_encuadernacion.find_one({"_id": ObjectId(id)})
            updated_doc["_id"] = str(updated_doc["_id"])
            
            return EncuadernacionSchema(**updated_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al cambiar estado de encuadernación: {str(e)}")

    return router
