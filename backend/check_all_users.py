from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
MONGO_COLLECTION_USERS = os.getenv('MONGO_COLLECTION_USERS', 'users')

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection = db[MONGO_COLLECTION_USERS]

# Buscar todos los usuarios
users = list(collection.find({}))
print(f'Total de usuarios: {len(users)}')
print('\nUsuarios completos:')
for user in users:
    print(f'- Username: {user.get("username")}')
    print(f'  Email: {user.get("email")}')
    print(f'  Admin: {user.get("is_admin")}')
    print(f'  Activo: {user.get("is_active")}')
    print(f'  Password hash: {user.get("password_hash", "No hash")[:50]}...')
    print('---')

# Buscar específicamente el usuario "admin"
admin_user = collection.find_one({"username": "admin"})
if admin_user:
    print('\nUsuario "admin" encontrado:')
    print(f'- Email: {admin_user.get("email")}')
    print(f'- Admin: {admin_user.get("is_admin")}')
    print(f'- Activo: {admin_user.get("is_active")}')
else:
    print('\nNo se encontró usuario "admin"')
