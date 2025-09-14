import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Agregar el directorio padre al path para importar servicios
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.auth_service import AuthService

# Cargar variables de entorno
load_dotenv()

def create_users_collection():
    """Crear colección de usuarios y usuarios admin por defecto"""
    
    # Conectar a MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME")
    users_collection_name = os.getenv("MONGO_COLLECTION_USERS", "users")
    
    if not mongo_uri or not db_name:
        print("Error: MONGO_URI y MONGO_DB_NAME deben estar configurados en .env")
        return False
    
    try:
        # Conectar a la base de datos
        client = MongoClient(mongo_uri)
        db = client[db_name]
        users_collection = db[users_collection_name]
        
        print(f"Conectado a MongoDB: {db_name}")
        print(f"Colección de usuarios: {users_collection_name}")
        
        # Inicializar servicio de autenticación
        auth_service = AuthService(users_collection)
        
        # Verificar si ya existen usuarios
        existing_users = users_collection.count_documents({})
        if existing_users > 0:
            print(f"Ya existen {existing_users} usuarios en la colección")
            
            # Mostrar usuarios existentes
            users = list(users_collection.find({}, {"username": 1, "email": 1, "is_admin": 1, "created_at": 1}))
            for user in users:
                print(f"- {user['username']} ({user['email']}) - Admin: {user['is_admin']}")
            
            response = input("¿Deseas crear usuarios adicionales? (y/n): ")
            if response.lower() != 'y':
                return True
        
        # Crear usuarios admin por defecto
        default_users = [
            {
                "username": "admin1",
                "email": "admin1@leyesvzla.com",
                "password": "Admin123!@#",  # Contraseña fuerte por defecto
                "is_admin": True
            },
            {
                "username": "admin2", 
                "email": "admin2@leyesvzla.com",
                "password": "Admin456!@#",  # Contraseña fuerte por defecto
                "is_admin": True
            }
        ]
        
        created_users = []
        
        for user_data in default_users:
            try:
                # Verificar si el usuario ya existe
                existing_user = auth_service.get_user_by_username(user_data["username"])
                if existing_user:
                    print(f"Usuario {user_data['username']} ya existe, saltando...")
                    continue
                
                # Crear usuario
                new_user = auth_service.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password=user_data["password"],
                    is_admin=user_data["is_admin"]
                )
                
                created_users.append(user_data["username"])
                print(f"✅ Usuario creado: {user_data['username']} ({user_data['email']})")
                
            except ValueError as e:
                print(f"❌ Error creando usuario {user_data['username']}: {str(e)}")
            except Exception as e:
                print(f"❌ Error inesperado creando usuario {user_data['username']}: {str(e)}")
        
        # Crear índices para optimizar consultas
        try:
            users_collection.create_index("username", unique=True)
            users_collection.create_index("email", unique=True)
            users_collection.create_index("reset_token")
            print("✅ Índices creados correctamente")
        except Exception as e:
            print(f"⚠️ Error creando índices: {str(e)}")
        
        # Resumen
        total_users = users_collection.count_documents({})
        admin_users = users_collection.count_documents({"is_admin": True})
        
        print(f"\n📊 Resumen:")
        print(f"- Total de usuarios: {total_users}")
        print(f"- Usuarios admin: {admin_users}")
        print(f"- Usuarios creados en esta ejecución: {len(created_users)}")
        
        if created_users:
            print(f"\n🔐 Credenciales por defecto:")
            for i, username in enumerate(created_users):
                password = default_users[i]["password"]
                print(f"- {username}: {password}")
            print("\n⚠️ IMPORTANTE: Cambia estas contraseñas después del primer login")
        
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {str(e)}")
        return False
    
    finally:
        try:
            client.close()
        except:
            pass

if __name__ == "__main__":
    print("🚀 Creando colección de usuarios y usuarios admin por defecto...")
    success = create_users_collection()
    
    if success:
        print("\n✅ Proceso completado exitosamente")
    else:
        print("\n❌ Proceso completado con errores")
        sys.exit(1)
