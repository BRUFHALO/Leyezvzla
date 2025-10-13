from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.collection import Collection
from typing import List
from datetime import timedelta
from services.auth_service import AuthService
from schemas.user_schemas import UserLoginSchema, UserCreateSchema, UserResponseSchema, PasswordResetRequestSchema, PasswordResetSchema, PasswordChangeSchema, TokenSchema

security = HTTPBearer()

def get_auth_routes(users_collection: Collection) -> APIRouter:
    router = APIRouter(prefix="/auth", tags=["authentication"])
    auth_service = AuthService(users_collection)

    async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
        """Dependency para obtener el usuario actual desde el token"""
        token = credentials.credentials
        user = auth_service.get_current_user_from_token(token)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    async def get_current_active_user(current_user: dict = Depends(get_current_user)):
        """Dependency para obtener usuario activo"""
        if not current_user.get("is_active"):
            raise HTTPException(status_code=400, detail="Usuario inactivo")
        return current_user

    @router.post("/login", response_model=TokenSchema)
    async def login(user_credentials: UserLoginSchema):
        """Iniciar sesión"""
        try:
            user = auth_service.authenticate_user(
                user_credentials.username, 
                user_credentials.password
            )
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales incorrectas o cuenta bloqueada",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verificar si la contraseña ha expirado
            password_needs_reset = auth_service.is_password_expired(user)
            
            # Crear token de acceso
            access_token_expires = timedelta(minutes=30)
            access_token = auth_service.create_access_token(
                data={"sub": str(user["_id"])}, 
                expires_delta=access_token_expires
            )
            
            # Preparar respuesta del usuario
            user_response = UserResponseSchema(
                _id=str(user["_id"]),
                username=user["username"],
                email=user["email"],
                is_active=user["is_active"],
                is_admin=user["is_admin"],
                created_at=user["created_at"],
                last_login=user.get("last_login"),
                password_needs_reset=password_needs_reset
            )
            
            return TokenSchema(
                access_token=access_token,
                token_type="bearer",
                expires_in=1800,  # 30 minutos en segundos
                user=user_response
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error en el login: {str(e)}"
            )

    @router.post("/register", response_model=UserResponseSchema)
    async def register(user_data: UserCreateSchema, current_user: dict = Depends(get_current_active_user)):
        """Registrar nuevo usuario (solo admins)"""
        try:
            if not current_user.get("is_admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo los administradores pueden crear usuarios"
                )
            
            new_user = auth_service.create_user(
                username=user_data.username,
                email=user_data.email,
                password=user_data.password,
                is_admin=user_data.is_admin
            )
            
            return UserResponseSchema(
                _id=str(new_user["_id"]),
                username=new_user["username"],
                email=new_user["email"],
                is_active=new_user["is_active"],
                is_admin=new_user["is_admin"],
                created_at=new_user["created_at"],
                last_login=new_user.get("last_login"),
                password_needs_reset=False
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear usuario: {str(e)}"
            )

    @router.get("/me", response_model=UserResponseSchema)
    async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
        """Obtener información del usuario actual"""
        password_needs_reset = auth_service.is_password_expired(current_user)
        
        return UserResponseSchema(
            _id=str(current_user["_id"]),
            username=current_user["username"],
            email=current_user["email"],
            is_active=current_user["is_active"],
            is_admin=current_user["is_admin"],
            created_at=current_user["created_at"],
            last_login=current_user.get("last_login"),
            password_needs_reset=password_needs_reset
        )

    @router.post("/password-reset-request")
    async def request_password_reset(request: PasswordResetRequestSchema):
        """Solicitar recuperación de contraseña"""
        try:
            print(f"🔄 Procesando solicitud de recuperación para: {request.username}")
            success = auth_service.request_password_reset(request.username)
            print(f"✅ Resultado de la solicitud: {success}")
            
            if success:
                return {"message": "Se ha enviado una contraseña temporal por Telegram al administrador"}
            else:
                return {"message": "Si el usuario existe, se enviará una contraseña temporal por Telegram"}
            
        except Exception as e:
            # Log del error completo para debugging
            print(f"❌ Error en password reset request: {str(e)}")
            print(f"📧 Tipo de error: {type(e).__name__}")
            import traceback
            print(f"🔍 Traceback completo: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error procesando la solicitud de recuperación"
            )

    @router.post("/password-reset")
    async def reset_password(reset_data: PasswordResetSchema):
        """Restablecer contraseña con token"""
        try:
            success = auth_service.reset_password_with_token(
                reset_data.token, 
                reset_data.new_password
            )
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token inválido o expirado"
                )
            
            return {"message": "Contraseña restablecida exitosamente"}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al restablecer contraseña: {str(e)}"
            )

    @router.post("/change-password")
    async def change_password(
        password_data: PasswordChangeSchema, 
        current_user: dict = Depends(get_current_active_user)
    ):
        """Cambiar contraseña del usuario actual"""
        try:
            success = auth_service.change_password(
                str(current_user["_id"]),
                password_data.current_password,
                password_data.new_password
            )
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contraseña actual incorrecta"
                )
            
            return {"message": "Contraseña cambiada exitosamente"}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al cambiar contraseña: {str(e)}"
            )

    @router.get("/users", response_model=List[UserResponseSchema])
    async def get_all_users(current_user: dict = Depends(get_current_active_user)):
        """Obtener todos los usuarios (solo admins)"""
        try:
            if not current_user.get("is_admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo los administradores pueden ver todos los usuarios"
                )
            
            users = list(users_collection.find())
            user_responses = []
            
            for user in users:
                password_needs_reset = auth_service.is_password_expired(user)
                user_responses.append(UserResponseSchema(
                    _id=str(user["_id"]),
                    username=user["username"],
                    email=user["email"],
                    is_active=user["is_active"],
                    is_admin=user["is_admin"],
                    created_at=user["created_at"],
                    last_login=user.get("last_login"),
                    password_needs_reset=password_needs_reset
                ))
            
            return user_responses
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener usuarios: {str(e)}"
            )

    @router.put("/users/{user_id}", response_model=UserResponseSchema)
    async def update_user(
        user_id: str, 
        user_updates: dict, 
        current_user: dict = Depends(get_current_active_user)
    ):
        """Actualizar usuario (solo admins)"""
        try:
            if not current_user.get("is_admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo los administradores pueden actualizar usuarios"
                )
            
            # Validar que el user_id sea válido
            from bson import ObjectId
            try:
                object_id = ObjectId(user_id)
            except:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ID de usuario inválido"
                )
            
            # Verificar que el usuario existe
            existing_user = users_collection.find_one({"_id": object_id})
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )
            
            # Filtrar solo los campos permitidos para actualizar
            allowed_fields = {"email", "is_admin", "is_active"}
            update_data = {k: v for k, v in user_updates.items() if k in allowed_fields}
            
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay campos válidos para actualizar"
                )
            
            # Actualizar usuario
            result = users_collection.update_one(
                {"_id": object_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo actualizar el usuario"
                )
            
            # Obtener usuario actualizado
            updated_user = users_collection.find_one({"_id": object_id})
            password_needs_reset = auth_service.is_password_expired(updated_user)
            
            return UserResponseSchema(
                _id=str(updated_user["_id"]),
                username=updated_user["username"],
                email=updated_user["email"],
                is_active=updated_user["is_active"],
                is_admin=updated_user["is_admin"],
                created_at=updated_user["created_at"],
                last_login=updated_user.get("last_login"),
                password_needs_reset=password_needs_reset
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar usuario: {str(e)}"
            )

    @router.delete("/users/{user_id}")
    async def delete_user(
        user_id: str, 
        current_user: dict = Depends(get_current_active_user)
    ):
        """Eliminar usuario (solo admins)"""
        try:
            if not current_user.get("is_admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo los administradores pueden eliminar usuarios"
                )
            
            # Validar que el user_id sea válido
            from bson import ObjectId
            try:
                object_id = ObjectId(user_id)
            except:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ID de usuario inválido"
                )
            
            # Verificar que no se esté eliminando a sí mismo
            if str(current_user["_id"]) == user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes eliminar tu propio usuario"
                )
            
            # Verificar que el usuario existe
            existing_user = users_collection.find_one({"_id": object_id})
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )
            
            # Eliminar usuario
            result = users_collection.delete_one({"_id": object_id})
            
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo eliminar el usuario"
                )
            
            return {"message": "Usuario eliminado exitosamente"}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar usuario: {str(e)}"
            )

    return router
