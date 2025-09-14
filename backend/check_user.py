import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.mongodb import get_database

def check_user():
    try:
        db = get_database()
        users = db['users']
        
        # Buscar admin1
        user = users.find_one({'username': 'admin1'})
        
        if user:
            print(f"✅ Usuario encontrado: {user['username']}")
            print(f"📧 Email: {user.get('email', 'No definido')}")
            print(f"🔒 Password hash: {user.get('password', 'No definido')[:30]}...")
            print(f"🔄 Needs reset: {user.get('password_needs_reset', False)}")
            print(f"📅 Temp password created: {user.get('temp_password_created', 'No definido')}")
            print(f"🔐 Account locked: {user.get('account_locked', False)}")
            print(f"❌ Failed attempts: {user.get('failed_login_attempts', 0)}")
        else:
            print("❌ Usuario admin1 no encontrado")
            
        # Listar todos los usuarios
        all_users = list(users.find({}, {'username': 1, 'email': 1}))
        print(f"\n📋 Total usuarios en BD: {len(all_users)}")
        for u in all_users:
            print(f"  - {u.get('username', 'Sin username')} ({u.get('email', 'Sin email')})")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_user()
