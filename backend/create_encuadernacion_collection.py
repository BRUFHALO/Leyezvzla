#!/usr/bin/env python3
"""
Script para crear la colección de encuadernación en MongoDB
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_COLLECTION_ENCUADERNACION = os.getenv("MONGO_COLLECTION_ENCUADERNACION", "encuadernacion")

def main():
    """Función principal"""
    print("=== Creador de Colección - Encuadernación ===")
    
    try:
        # Conectar a MongoDB
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        
        # Probar la conexión
        client.admin.command('ping')
        print(f"✓ Conectado exitosamente a la base de datos '{MONGO_DB_NAME}'")
        
        # Verificar si la colección ya existe
        collections = db.list_collection_names()
        print(f"Colecciones existentes: {collections}")
        
        if MONGO_COLLECTION_ENCUADERNACION in collections:
            print(f"✓ La colección '{MONGO_COLLECTION_ENCUADERNACION}' ya existe")
        else:
            print(f"⚠ La colección '{MONGO_COLLECTION_ENCUADERNACION}' no existe. Creándola...")
            
            # Crear la colección explícitamente
            collection = db.create_collection(MONGO_COLLECTION_ENCUADERNACION)
            print(f"✓ Colección '{MONGO_COLLECTION_ENCUADERNACION}' creada exitosamente")
            
            # Crear índices para optimizar las consultas
            collection.create_index([("material", 1), ("tamano", 1)], unique=True)
            collection.create_index("activo")
            print("✓ Índices creados exitosamente")
        
        # Verificar el contenido de la colección
        collection = db[MONGO_COLLECTION_ENCUADERNACION]
        count = collection.count_documents({})
        print(f"✓ La colección tiene {count} documentos")
        
        if count > 0:
            print("\nDocumentos en la colección:")
            for doc in collection.find():
                print(f"  - {doc['material']} {doc['tamano']}: ${doc['precio']}")
        
        print("\n=== Proceso completado exitosamente ===")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
