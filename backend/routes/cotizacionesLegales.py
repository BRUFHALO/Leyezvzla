import json
import os
from typing import List

import httpx
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from pymongo.collection import Collection

from schemas.cotizacionesLegales_schemas import CotizacionLegalSchema, LeySchema

class EstadoUpdate(BaseModel):
    estado: str

def serialize_datetime(obj):
    """Función auxiliar para serializar objetos datetime a string ISO format"""
    from datetime import datetime
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Tipo {type(obj)} no es serializable")

async def send_n8n_notification(cotizacion_data: dict) -> bool:
    """
    Envía una notificación al webhook de n8n cuando se crea una nueva cotización.
    
    Args:
        cotizacion_data: Diccionario con los datos de la cotización
        
    Returns:
        bool: True si la notificación se envió correctamente, False en caso contrario
    """
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    webhook_secret = os.getenv("N8N_WEBHOOK_SECRET", "")
    
    if not webhook_url:
        return False
    
    try:
        # Serializar manualmente los datos para manejar correctamente los datetime
        serialized_data = json.loads(json.dumps(cotizacion_data, default=serialize_datetime))
        
        # Preparar los datos para el webhook
        payload = {
            "data": serialized_data,
            "secret": webhook_secret
        }
        
        # Usar ensure_ascii=False para mantener caracteres especiales
        payload_str = json.dumps(payload, indent=2, ensure_ascii=False, default=serialize_datetime)
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "LeyesVzla-API/1.0",
            "Accept": "application/json"
        }
        
        # Configurar timeout (10 segundos de conexión, 30 segundos de espera)
        timeout = httpx.Timeout(10.0, connect=30.0)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                webhook_url,
                data=payload_str,  # Usar data en lugar de json para enviar el string ya serializado
                headers=headers
            )
            
            # Verificar el código de estado HTTP
            response.raise_for_status()
            
            # Verificar si la respuesta es JSON válido
            response.json()
            return True
            
    except (httpx.HTTPStatusError, httpx.RequestError, TypeError, ValueError, Exception):
        # Error silenciado intencionalmente
        pass
    
    return False

def get_routes(collection_leyes: Collection, collection_cotizaciones: Collection) -> APIRouter:
    router = APIRouter()

    @router.post("/test-webhook", status_code=status.HTTP_200_OK)
    async def test_webhook():
        """Endpoint de prueba para verificar el funcionamiento del webhook"""
        test_data = {
            "test": "Esta es una prueba del webhook",
            "fecha": "2025-09-15T11:30:00-04:00",
            "status": "success"
        }
        
        try:
            result = await send_n8n_notification({"test_data": test_data})
            if result:
                return {"status": "success", "message": "Notificación enviada correctamente"}
            else:
                return {"status": "error", "message": "Error al enviar la notificación"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al probar el webhook: {str(e)}"
            )

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
    async def update_cotizacion_estado(id: str, estado_data: dict):
        try:
            if not ObjectId.is_valid(id):
                raise HTTPException(status_code=400, detail="ID inválido")
            
            estado = estado_data.get("estado")
            
            # Verificar que el estado sea válido
            if estado not in ["pendiente", "entregado"]:
                raise HTTPException(status_code=400, detail="Estado inválido. Debe ser 'pendiente' o 'entregado'")
            
            # Buscar la cotización existente
            existing_cotizacion = collection_cotizaciones.find_one({"_id": ObjectId(id)})
            if not existing_cotizacion:
                raise HTTPException(status_code=404, detail="Cotización no encontrada")
            
            # Preparar los datos a actualizar
            update_data = {"estado": estado}
            
            # Si el estado es 'entregado', actualizar la fecha de entrega
            if estado == "entregado":
                from datetime import datetime
                update_data["fecha_entrega"] = datetime.now()
            
            # Actualizar el documento
            result = collection_cotizaciones.update_one(
                {"_id": ObjectId(id)}, 
                {"$set": update_data}
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
    async def create_cotizacion(cotizacion: CotizacionLegalSchema, background_tasks: BackgroundTasks):
        try:
            # Convertir el modelo Pydantic a diccionario
            cotizacion_dict = cotizacion.model_dump(by_alias=True, exclude_none=True)
            
            # Insertar la cotización en la base de datos
            result = collection_cotizaciones.insert_one(cotizacion_dict)
            created_cotizacion = collection_cotizaciones.find_one({"_id": result.inserted_id})
            
            if created_cotizacion:
                # Convertir ObjectId a string para el JSON
                created_cotizacion["_id"] = str(created_cotizacion["_id"])
                
                # Crear copia del diccionario para evitar modificar el original
                notification_data = created_cotizacion.copy()
                
                # Asegurarse de que los ObjectId se conviertan a string
                if "_id" in notification_data and isinstance(notification_data["_id"], ObjectId):
                    notification_data["_id"] = str(notification_data["_id"])
                
                # Enviar notificación en segundo plano
                background_tasks.add_task(
                    send_n8n_notification,
                    notification_data
                )
                
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