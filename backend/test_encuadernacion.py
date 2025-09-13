#!/usr/bin/env python3
"""
Script simple para probar la conexión y crear datos de encuadernación
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_COLLECTION_ENCUADERNACION = os.getenv("MONGO_COLLECTION_ENCUADERNACION", "encuadernacion")

def main():
    try:
        print("Conectando a MongoDB...")
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        collection = db[MONGO_COLLECTION_ENCUADERNACION]
        
        # Probar conexión
        client.admin.command('ping')
        print(f"✓ Conectado a '{MONGO_DB_NAME}'")
        
        # Verificar si ya hay datos
        count = collection.count_documents({})
        print(f"Documentos existentes: {count}")
        
        if count == 0:
            print("Insertando datos de encuadernación...")
            
            # Datos de encuadernación
            data = [
                {"material": "MDF", "tamano": "Carta", "precio": 20.0, "activo": True, "fecha_creacion": datetime.now(), "fecha_actualizacion": datetime.now()},
                {"material": "MDF", "tamano": "Pequeño", "precio": 15.0, "activo": True, "fecha_creacion": datetime.now(), "fecha_actualizacion": datetime.now()},
                {"material": "Cartón Gris", "tamano": "Pequeño", "precio": 15.0, "activo": True, "fecha_creacion": datetime.now(), "fecha_actualizacion": datetime.now()},
                {"material": "Plastificado", "tamano": "Carta", "precio": 10.0, "activo": True, "fecha_creacion": datetime.now(), "fecha_actualizacion": datetime.now()},
                {"material": "Plastificado", "tamano": "Pequeño", "precio": 5.0, "activo": True, "fecha_creacion": datetime.now(), "fecha_actualizacion": datetime.now()}
            ]
            
            result = collection.insert_many(data)
            print(f"✓ Insertados {len(result.inserted_ids)} documentos")
        
        # Mostrar datos
        print("\nDatos en la colección:")
        for doc in collection.find():
            print(f"- {doc['material']} {doc['tamano']}: ${doc['precio']}")
            
        print("\n✓ Todo funcionando correctamente")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
