#!/usr/bin/env python3
"""
Script para poblar la base de datos con los tipos de encuadernación iniciales
basados en el catálogo de opciones de encuadernación.
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

def connect_to_database():
    """Conectar a la base de datos MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        collection = db[MONGO_COLLECTION_ENCUADERNACION]
        
        # Probar la conexión
        client.admin.command('ping')
        print(f"✓ Conectado exitosamente a la base de datos '{MONGO_DB_NAME}'")
        
        return collection
    except Exception as e:
        print(f"✗ Error al conectar a la base de datos: {e}")
        sys.exit(1)

def populate_encuadernacion_data(collection):
    """Poblar la colección con datos iniciales de encuadernación"""
    
    # Datos iniciales basados en el catálogo de la imagen
    encuadernacion_data = [
        {
            "material": "MDF",
            "tamano": "Carta",
            "precio": 20.0,
            "activo": True,
            "fecha_creacion": datetime.now(),
            "fecha_actualizacion": datetime.now()
        },
        {
            "material": "MDF",
            "tamano": "Pequeño",
            "precio": 15.0,
            "activo": True,
            "fecha_creacion": datetime.now(),
            "fecha_actualizacion": datetime.now()
        },
        {
            "material": "Cartón Gris",
            "tamano": "Pequeño",
            "precio": 15.0,
            "activo": True,
            "fecha_creacion": datetime.now(),
            "fecha_actualizacion": datetime.now()
        },
        {
            "material": "Plastificado",
            "tamano": "Carta",
            "precio": 10.0,
            "activo": True,
            "fecha_creacion": datetime.now(),
            "fecha_actualizacion": datetime.now()
        },
        {
            "material": "Plastificado",
            "tamano": "Pequeño",
            "precio": 5.0,
            "activo": True,
            "fecha_creacion": datetime.now(),
            "fecha_actualizacion": datetime.now()
        }
    ]
    
    print("Poblando la base de datos con tipos de encuadernación...")
    
    # Verificar si ya existen datos
    existing_count = collection.count_documents({})
    if existing_count > 0:
        print(f"⚠ Ya existen {existing_count} registros en la colección.")
        response = input("¿Desea continuar y agregar los datos iniciales? (s/n): ").lower().strip()
        if response not in ['s', 'si', 'sí', 'y', 'yes']:
            print("Operación cancelada.")
            return
    
    # Insertar datos
    inserted_count = 0
    for encuadernacion in encuadernacion_data:
        # Verificar si ya existe una combinación de material y tamaño
        existing = collection.find_one({
            "material": encuadernacion["material"],
            "tamano": encuadernacion["tamano"]
        })
        
        if existing:
            print(f"⚠ Ya existe: {encuadernacion['material']} - {encuadernacion['tamano']}")
        else:
            try:
                result = collection.insert_one(encuadernacion)
                print(f"✓ Insertado: {encuadernacion['material']} - {encuadernacion['tamano']} (${encuadernacion['precio']})")
                inserted_count += 1
            except Exception as e:
                print(f"✗ Error al insertar {encuadernacion['material']} - {encuadernacion['tamano']}: {e}")
    
    print(f"\n✓ Proceso completado. Se insertaron {inserted_count} nuevos registros.")
    
    # Mostrar resumen de todos los registros
    print("\n--- Resumen de tipos de encuadernación en la base de datos ---")
    all_encuadernaciones = list(collection.find({}).sort("material", 1))
    
    if all_encuadernaciones:
        print(f"{'Material':<15} {'Tamaño':<10} {'Precio':<8} {'Estado':<8}")
        print("-" * 45)
        for enc in all_encuadernaciones:
            estado = "Activo" if enc.get("activo", True) else "Inactivo"
            print(f"{enc['material']:<15} {enc['tamano']:<10} ${enc['precio']:<7.2f} {estado:<8}")
    else:
        print("No se encontraron registros en la base de datos.")

def main():
    """Función principal"""
    print("=== Poblador de Base de Datos - Tipos de Encuadernación ===")
    print("Este script agregará los tipos de encuadernación iniciales a la base de datos.\n")
    
    # Conectar a la base de datos
    collection = connect_to_database()
    
    # Poblar con datos iniciales
    populate_encuadernacion_data(collection)
    
    print("\n=== Proceso completado ===")

if __name__ == "__main__":
    main()
