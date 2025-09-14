import os
import sys
import bcrypt
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.mongodb import get_database

def test_login():
    try:
        db = get_database()
        users = db['users']
        
        # Buscar admin1
        user = users.find_one({'username': 'admin1'})
        
        if user:
            print(f"✅ Usuario encontrado: {user['username']}")
            stored_hash = user.get('password')
            print(f"🔒 Hash almacenado: {stored_hash[:30]}...")
            
            # Probar diferentes contraseñas
            test_passwords = [
                'Admin123!@#',  # Contraseña original
            ]
            
            for test_pass in test_passwords:
                print(f"\n🧪 Probando contraseña: {test_pass}")
                try:
                    # Verificar con bcrypt directamente
                    result = bcrypt.checkpw(test_pass.encode('utf-8'), stored_hash.encode('utf-8'))
                    print(f"   bcrypt.checkpw result: {result}")
                except Exception as e:
                    print(f"   ❌ Error en bcrypt: {e}")
                    
            # Mostrar información adicional del usuario
            print(f"\n📋 Información del usuario:")
            print(f"   - Email: {user.get('email')}")
            print(f"   - Password needs reset: {user.get('password_needs_reset')}")
            print(f"   - Failed attempts: {user.get('failed_login_attempts', 0)}")
            print(f"   - Account locked: {user.get('account_locked', False)}")
            print(f"   - Locked until: {user.get('locked_until', 'No definido')}")
            
        else:
            print("❌ Usuario admin1 no encontrado")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login()
