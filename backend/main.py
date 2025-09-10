import os
from fastapi import FastAPI
from pymongo import MongoClient
from dotenv import load_dotenv
from routes.cotizacionesLegales import get_routes
from fastapi.middleware.cors import CORSMiddleware

# Cargar variables de entorno
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_COLLECTION_LEYES = os.getenv("MONGO_COLLECTION_LEYES")
MONGO_COLLECTION_COTIZACIONES = os.getenv("MONGO_COLLECTION_COTIZACIONES")

# Inicializar FastAPI
app = FastAPI()

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection_leyes = db[MONGO_COLLECTION_LEYES]
collection_cotizaciones = db[MONGO_COLLECTION_COTIZACIONES]
print(f"Conectado a la base de datos '{MONGO_DB_NAME}'")
print(f"Colecciones disponibles: {db.list_collection_names()}")


# CORS
origins = [
    "http://localhost",
    "http://localhost:5174"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(
    get_routes(collection_leyes, collection_cotizaciones),
    prefix="",
    tags=["Leyes y Cotizaciones"]
)

@app.get("/")
def read_root():
    return {"message": "API de LeyesVzla funcionando"}