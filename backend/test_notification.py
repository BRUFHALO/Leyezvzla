import asyncio
import os
from dotenv import load_dotenv
import httpx

# Cargar variables de entorno
load_dotenv()

async def test_notification():
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    
    if not webhook_url:
        print("ERROR: N8N_WEBHOOK_URL no está configurado en las variables de entorno")
        return
    
    test_data = {
        "test_data": {
            "test": "Prueba de notificación",
            "fecha": "2025-09-15T11:30:00-04:00",
            "status": "success"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "LeyesVzla-Test/1.0"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print(f"Enviando prueba a: {webhook_url}")
            response = await client.post(
                webhook_url,
                json=test_data,
                headers=headers,
                timeout=10.0
            )
            
            print(f"Respuesta: {response.status_code}")
            print(f"Contenido: {response.text}")
            
    except Exception as e:
        print(f"Error al enviar notificación: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_notification())
