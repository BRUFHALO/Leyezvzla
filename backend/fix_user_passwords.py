from pymongo import MongoClient
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime

# Configurar hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
MONGO_COLLECTION_USERS = os.getenv('MONGO_COLLECTION_USERS', 'users')

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection = db[MONGO_COLLECTION_USERS]

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Actualizar contraseñas de admin1 y admin2
users_to_update = [
    {"username": "admin1", "password": "Admin123!@#"},
    {"username": "admin2", "password": "Admin456!@#"}
]

print("Actualizando contraseñas de usuarios...")

for user_data in users_to_update:
    username = user_data["username"]
    password = user_data["password"]
    
    # Hash de la contraseña
    password_hash = hash_password(password)
    
    # Actualizar en la base de datos
    result = collection.update_one(
        {"username": username},
        {
            "$set": {
                "password_hash": password_hash,
                "updated_at": datetime.utcnow(),
                "password_changed_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"✅ Contraseña actualizada para {username}")
    else:
        print(f"❌ No se pudo actualizar la contraseña para {username}")

print("\nVerificando usuarios actualizados:")
users = list(collection.find({}, {'username': 1, 'email': 1, 'password_hash': 1}))
for user in users:
    has_hash = "Sí" if user.get("password_hash") else "No"
    print(f"- {user.get('username')}: Hash de contraseña: {has_hash}")

print("\n✅ Proceso completado. Ahora puedes usar:")
print("- Usuario: admin1 | Contraseña: Admin123!@#")
print("- Usuario: admin2 | Contraseña: Admin456!@#")
