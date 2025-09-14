import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def update_admin2_email():
    # Conectar a MongoDB
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri)
    db = client[os.getenv('MONGO_DB', 'cotizaciones_legales')]
    users_collection = db[os.getenv('MONGO_COLLECTION_USERS', 'users')]
    
    # Actualizar admin2 con email
    result = users_collection.update_one(
        {"username": "admin2"},
        {"$set": {"email": "admin2@leyesvzla.com"}}
    )
    
    if result.modified_count > 0:
        print("✅ Email de admin2 actualizado correctamente")
    else:
        print("❌ No se pudo actualizar el email de admin2")
    
    # Verificar la actualización
    admin2 = users_collection.find_one({"username": "admin2"})
    if admin2:
        print(f"Email de admin2: {admin2.get('email', 'No configurado')}")
    
    client.close()

if __name__ == "__main__":
    update_admin2_email()
