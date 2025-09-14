from pymongo import MongoClient
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "cotizaciones_legales")
MONGO_COLLECTION_LEYES = os.getenv("MONGO_COLLECTION_LEYES", "leyes")
MONGO_COLLECTION_COTIZACIONES = os.getenv("MONGO_COLLECTION_COTIZACIONES", "cotizaciones")



client = None
db = None

def connect_to_mongo():
    global client, db
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        print(f"Conectado a la base de datos '{MONGO_DB_NAME}'")
        print(f"Colecciones disponibles: {db.list_collection_names()}")
   
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al conectar a MongoDB: {e}")

def get_collection_leyes():
    global db
    if db is None: 
        raise HTTPException(status_code=500, detail="Base de datos no conectada")
    return db[MONGO_COLLECTION_LEYES]

def get_collection_cotizaciones():
    global db
    if db is None: 
        raise HTTPException(status_code=500, detail="Base de datos no conectada")
    return db[MONGO_COLLECTION_COTIZACIONES]

def get_database():
    global db
    if db is None:
        connect_to_mongo()
    return db

def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Conexión a MongoDB cerrada")