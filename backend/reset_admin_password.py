import os
import sys
import bcrypt
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.mongodb import get_database

def reset_admin_password():
    try:
        db = get_database()
        users = db['users']
        
        # Nueva contraseña temporal conocida
        temp_pass = 'TempPass123!'
        
        # Buscar admin1
        user = users.find_one({'username': 'admin1'})
        
        if user:
            print(f"✅ Usuario encontrado: {user['username']}")
            
            # Generar hash de la nueva contraseña temporal
            new_hash = bcrypt.hashpw(temp_pass.encode('utf-8'), bcrypt.gensalt())
            
            # Actualizar usuario con nueva contraseña y resetear intentos fallidos
            result = users.update_one(
                {'_id': user['_id']}, 
                {
                    '$set': {
                        'password': new_hash.decode('utf-8'),
                        'failed_login_attempts': 0,
                        'password_needs_reset': True,
                        'account_locked': False
                    },
                    '$unset': {
                        'locked_until': ""
                    }
                }
            )
            
            print(f"✅ Usuario actualizado. Modified count: {result.modified_count}")
            print(f"🔑 Nueva contraseña temporal: {temp_pass}")
            print(f"📝 Usa esta contraseña para iniciar sesión como admin1")
            
            # Verificar que funciona
            updated_user = users.find_one({'username': 'admin1'})
            stored_hash = updated_user.get('password')
            verification = bcrypt.checkpw(temp_pass.encode('utf-8'), stored_hash.encode('utf-8'))
            print(f"✅ Verificación de contraseña: {verification}")
            
        else:
            print("❌ Usuario admin1 no encontrado")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_admin_password()
