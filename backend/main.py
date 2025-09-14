import os
from fastapi import FastAPI
from pymongo import MongoClient
from dotenv import load_dotenv
from routes.cotizacionesLegales import get_routes
from routes.encuadernacion import get_encuadernacion_routes
from routes.auth import get_auth_routes
from fastapi.middleware.cors import CORSMiddleware

# Cargar variables de entorno
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_COLLECTION_LEYES = os.getenv("MONGO_COLLECTION_LEYES")
MONGO_COLLECTION_COTIZACIONES = os.getenv("MONGO_COLLECTION_COTIZACIONES")
MONGO_COLLECTION_ENCUADERNACION = os.getenv("MONGO_COLLECTION_ENCUADERNACION", "encuadernacion")
MONGO_COLLECTION_USERS = os.getenv("MONGO_COLLECTION_USERS", "users")

# Inicializar FastAPI
app = FastAPI(title="LeyesVzla API", description="API para gestión de cotizaciones legales", version="1.0.0")

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection_leyes = db[MONGO_COLLECTION_LEYES]
collection_cotizaciones = db[MONGO_COLLECTION_COTIZACIONES]
collection_encuadernacion = db[MONGO_COLLECTION_ENCUADERNACION]
collection_users = db[MONGO_COLLECTION_USERS]
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

app.include_router(
    get_encuadernacion_routes(collection_encuadernacion),
    prefix="",
    tags=["Encuadernación"]
)

app.include_router(
    get_auth_routes(collection_users),
    prefix="",
    tags=["Autenticación"]
)

@app.get("/")
def read_root():
    return {"message": "API de LeyesVzla funcionando"}