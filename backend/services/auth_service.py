import os
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo.collection import Collection
from bson import ObjectId
from dotenv import load_dotenv
from services.telegram_service import TelegramService

load_dotenv()

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Configuración de expiración de contraseñas (2 meses)
PASSWORD_EXPIRE_DAYS = 60

class AuthService:
    def __init__(self, users_collection: Collection):
        self.users_collection = users_collection
        self.telegram_service = TelegramService()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verificar contraseña"""
        # Limitar contraseña a 72 bytes para bcrypt
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            plain_password = password_bytes[:72].decode('utf-8', errors='ignore')
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generar hash de contraseña"""
        # Limitar contraseña a 72 bytes para bcrypt
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password = password_bytes[:72].decode('utf-8', errors='ignore')
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Crear token JWT"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por nombre de usuario"""
        return self.users_collection.find_one({"username": username})

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por email"""
        return self.users_collection.find_one({"email": email})

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por ID"""
        if not ObjectId.is_valid(user_id):
            return None
        return self.users_collection.find_one({"_id": ObjectId(user_id)})

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Autenticar usuario"""
        user = self.get_user_by_username(username)
        if not user:
            return None
        
        # Verificar si la cuenta está bloqueada
        if user.get("locked_until") and user["locked_until"] > datetime.utcnow():
            return None
        
        # Verificar contraseña - usar el campo correcto
        password_field = user.get("password", user.get("hashed_password"))
        if not self.verify_password(password, password_field):
            # Incrementar intentos fallidos
            self.increment_failed_attempts(user["_id"])
            return None
        
        # Resetear intentos fallidos y actualizar último login
        self.reset_failed_attempts(user["_id"])
        self.update_last_login(user["_id"])
        
        return user

    def increment_failed_attempts(self, user_id: ObjectId):
        """Incrementar intentos fallidos de login"""
        user = self.users_collection.find_one({"_id": user_id})
        failed_attempts = user.get("failed_login_attempts", 0) + 1
        
        update_data = {"failed_login_attempts": failed_attempts}
        
        # Bloquear cuenta después de 5 intentos fallidos por 30 minutos
        if failed_attempts >= 5:
            update_data["locked_until"] = datetime.utcnow() + timedelta(minutes=30)
        
        self.users_collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )

    def reset_failed_attempts(self, user_id: ObjectId):
        """Resetear intentos fallidos"""
        self.users_collection.update_one(
            {"_id": user_id},
            {"$set": {
                "failed_login_attempts": 0,
                "locked_until": None
            }}
        )

    def update_last_login(self, user_id: ObjectId):
        """Actualizar último login"""
        self.users_collection.update_one(
            {"_id": user_id},
            {"$set": {"last_login": datetime.utcnow()}}
        )

    def is_password_expired(self, user: Dict[str, Any]) -> bool:
        """Verificar si la contraseña ha expirado (2 meses)"""
        password_created_at = user.get("password_created_at")
        if not password_created_at:
            return True
        
        expiry_date = password_created_at + timedelta(days=PASSWORD_EXPIRE_DAYS)
        return datetime.utcnow() > expiry_date

    def create_user(self, username: str, email: str, password: str, is_admin: bool = True) -> Dict[str, Any]:
        """Crear nuevo usuario"""
        # Verificar si el usuario ya existe
        if self.get_user_by_username(username):
            raise ValueError("El nombre de usuario ya existe")
        
        if self.get_user_by_email(email):
            raise ValueError("El email ya está registrado")
        
        # Crear usuario
        user_data = {
            "username": username,
            "email": email,
            "hashed_password": self.get_password_hash(password),
            "is_active": True,
            "is_admin": is_admin,
            "created_at": datetime.utcnow(),
            "password_created_at": datetime.utcnow(),
            "last_login": None,
            "failed_login_attempts": 0,
            "locked_until": None,
            "reset_token": None,
            "reset_token_expires": None
        }
        
        result = self.users_collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return user_data

    def request_password_reset(self, username: str) -> bool:
        """Solicitar recuperación de contraseña - envía contraseña temporal"""
        try:
            print(f"🔍 Buscando usuario con username: {username}")
            user = self.users_collection.find_one({"username": username})
            
            if not user:
                # No enviar mensaje si el username no está registrado
                print(f"⚠️ Intento de recuperación para username no registrado: {username}")
                return False
            
            print(f"✅ Usuario encontrado: {user['username']}")
            
            # Generar contraseña temporal
            print(f"🔐 Generando contraseña temporal...")
            temp_password = self.generate_temporary_password()
            print(f"✅ Contraseña temporal generada: {temp_password}")
            
            # Hash de la contraseña temporal
            print(f"🔒 Hasheando contraseña temporal...")
            temp_password_hash = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt())
            print(f"✅ Hash generado correctamente")
            
            # Actualizar usuario con contraseña temporal y marcar que necesita cambio
            print(f"💾 Actualizando usuario en base de datos...")
            result = self.users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "password": temp_password_hash.decode('utf-8'),
                        "password_needs_reset": True,
                        "temp_password_created": datetime.utcnow()
                    },
                    "$unset": {
                        "reset_token": "",
                        "reset_token_expires": ""
                    }
                }
            )
            print(f"✅ Usuario actualizado. Modified count: {result.modified_count}")
            
            # Enviar contraseña temporal por Telegram
            print(f"📱 Enviando contraseña temporal por Telegram")
            telegram_result = self.telegram_service.send_password_recovery(
                username=user["username"],
                email=user.get("email", "No especificado"),
                temp_password=temp_password
            )
            print(f"📱 Resultado del envío: {telegram_result}")
            return telegram_result
            
        except Exception as e:
            print(f"❌ Error en request_password_reset: {str(e)}")
            print(f"📧 Tipo de error: {type(e).__name__}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
            raise e

    def generate_temporary_password(self) -> str:
        """Generar contraseña temporal segura"""
        import string
        import random
        import secrets
        
        # Generar contraseña de 12 caracteres con mayúsculas, minúsculas, números y símbolos
        characters = string.ascii_letters + string.digits + "!@#$%&*"
        temp_password = ''.join(random.choice(characters) for _ in range(12))
        
        # Asegurar que tenga al menos una mayúscula, minúscula, número y símbolo
        if not any(c.isupper() for c in temp_password):
            temp_password = temp_password[:-1] + random.choice(string.ascii_uppercase)
        if not any(c.islower() for c in temp_password):
            temp_password = temp_password[:-1] + random.choice(string.ascii_lowercase)
        if not any(c.isdigit() for c in temp_password):
            temp_password = temp_password[:-1] + random.choice(string.digits)
        if not any(c in "!@#$%&*" for c in temp_password):
            temp_password = temp_password[:-1] + random.choice("!@#$%&*")
            
        return temp_password

    def send_temporary_password_telegram(self, email: str, temp_password: str, username: str) -> bool:
        """Enviar contraseña temporal por Telegram (método legacy - ahora usa telegram_service directamente)"""
        return self.telegram_service.send_password_recovery(
            username=username,
            email=email,
            temp_password=temp_password
        )

    def send_password_reset_email(self, email: str, token: str, username: str) -> bool:
        """Enviar email de recuperación de contraseña"""
        try:
            # URL de recuperación (ajustar según tu frontend)
            reset_url = f"http://localhost:3000/reset-password?token={token}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Recuperación de Contraseña - LeyesVzla</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9fafb; }}
                    .button {{ display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                    .warning {{ background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>LeyesVzla</h1>
                        <p>Recuperación de Contraseña</p>
                    </div>
                    
                    <div class="content">
                        <h2>Hola {username},</h2>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en LeyesVzla.</p>
                        
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        
                        <a href="{reset_url}" class="button">Restablecer Contraseña</a>
                        
                        <div class="warning">
                            <strong>⚠️ Importante:</strong>
                            <ul>
                                <li>Este enlace es válido por 1 hora solamente</li>
                                <li>Si no solicitaste este cambio, ignora este email</li>
                                <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                            </ul>
                        </div>
                        
                        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #6b7280;">{reset_url}</p>
                        
                        <p>Si tienes problemas, contacta al administrador del sistema.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return EmailService.send_custom_email(
                to_email=email,
                subject="Recuperación de Contraseña - LawDesign",
                html_content=html_content
            )
            
        except Exception as e:
            print(f"❌ Error enviando email de recuperación: {str(e)}")
            print(f"📧 Tipo de error: {type(e).__name__}")
            print(f"🔍 Detalles del error: {repr(e)}")
            return False

    def reset_password_with_token(self, token: str, new_password: str) -> bool:
        """Restablecer contraseña usando token"""
        user = self.users_collection.find_one({
            "reset_token": token,
            "reset_token_expires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            return False
        
        # Actualizar contraseña y limpiar token
        self.users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "hashed_password": self.get_password_hash(new_password),
                "password_created_at": datetime.utcnow(),
                "reset_token": None,
                "reset_token_expires": None,
                "failed_login_attempts": 0,
                "locked_until": None
            }}
        )
        
        return True

    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Cambiar contraseña del usuario"""
        if not ObjectId.is_valid(user_id):
            return False
        
        user = self.users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return False
        
        # Verificar contraseña actual - usar el campo correcto
        password_field = user.get("password", user.get("hashed_password"))
        if not self.verify_password(current_password, password_field):
            return False
        
        # Actualizar contraseña
        self.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password": self.get_password_hash(new_password),
                "password_created_at": datetime.utcnow(),
                "password_needs_reset": False
            }}
        )
        
        return True

    def get_current_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario actual desde token JWT"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
        except JWTError:
            return None
        
        user = self.get_user_by_id(user_id)
        return user
