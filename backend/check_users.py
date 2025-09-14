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

users = list(collection.find({}, {'username': 1, 'email': 1, 'is_admin': 1, 'is_active': 1}))
print('Usuarios en la base de datos:')
for user in users:
    print(f'- {user.get("username")} ({user.get("email")}) - Admin: {user.get("is_admin")} - Activo: {user.get("is_active")}')
