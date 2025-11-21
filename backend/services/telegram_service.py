import os
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class TelegramService:
    """Servicio para enviar mensajes a través de Telegram Bot API"""
    
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "5567606129")
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
    
    def send_message(self, message: str, parse_mode: str = "HTML") -> bool:
        """
        Envía un mensaje a través de Telegram
        
        Args:
            message: Contenido del mensaje a enviar
            parse_mode: Formato del mensaje (HTML o Markdown)
            
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        try:
            if not self.bot_token:
                print("❌ Error: TELEGRAM_BOT_TOKEN no configurado")
                return False
            
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": parse_mode
            }
            
            print(f"📱 Enviando mensaje a Telegram (Chat ID: {self.chat_id})...")
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Mensaje enviado exitosamente a Telegram")
                return True
            else:
                print(f"❌ Error al enviar mensaje a Telegram: {response.status_code}")
                print(f"📄 Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error enviando mensaje a Telegram: {str(e)}")
            print(f"📧 Tipo de error: {type(e).__name__}")
            return False
    
    def send_password_recovery(self, username: str, email: str, temp_password: str) -> bool:
        """
        Envía un mensaje de recuperación de contraseña a través de Telegram
        
        Args:
            username: Nombre de usuario
            email: Email del usuario
            temp_password: Contraseña temporal generada
            
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        message = f"""
🔐 <b>Recuperación de Contraseña - LeyesVzla</b>

👤 <b>Usuario:</b> {username}
📧 <b>Email:</b> {email}

🔑 <b>Contraseña Temporal:</b>
<code>{temp_password}</code>

⚠️ <b>Instrucciones:</b>
• Esta contraseña es temporal
• Debe ser cambiada inmediatamente al iniciar sesión
• Por seguridad, expira en 24 horas

"""
        
        return self.send_message(message)
    
    def send_cotizacion_notification(self, cotizacion_data: dict) -> bool:
        """
        Envía una notificación de nueva cotización a través de Telegram
        
        Args:
            cotizacion_data: Diccionario con los datos de la cotización
            
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        try:
            # Extraer datos relevantes de la cotización con estructura anidada
            cliente_info = cotizacion_data.get("cliente", {})
            cliente_nombre = cliente_info.get("nombre", "No especificado") if isinstance(cliente_info, dict) else str(cliente_info)
            cliente_email = cliente_info.get("email", "No especificado") if isinstance(cliente_info, dict) else "No especificado"
            
            fecha_info = cotizacion_data.get("fecha", {})
            fecha_completa = fecha_info.get("fecha_completa", "No especificada") if isinstance(fecha_info, dict) else str(fecha_info)
            
            resumen_costo = cotizacion_data.get("resumen_costo", {})
            total = resumen_costo.get("total", 0) if isinstance(resumen_costo, dict) else 0
            
            estado = cotizacion_data.get("estado", "pendiente")
            cotizacion_id = cotizacion_data.get("_id", "No especificado")
            
            # Formatear el mensaje según el diseño deseado
            message = f"""
📋 <b>NUEVA COTIZACIÓN GENERADA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Cliente:</b> {cliente_nombre}
📧 <b>Email:</b> {cliente_email}
📅 <b>Fecha:</b> {fecha_completa}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 <b>Total:</b> ${total}
🏷️ <b>Estado:</b> {estado}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ <b>Acciones:</b>
• Revisar detalles completos
• Contactar al cliente
• Seguir el proceso de venta

📋 Esta cotización ha sido registrada en el sistema y está lista para su procesamiento.
            """
            
            return self.send_message(message)
            
        except Exception as e:
            print(f"❌ Error enviando notificación de cotización: {str(e)}")
            return False
    
    def send_test_message(self) -> bool:
        """
        Envía un mensaje de prueba para verificar la configuración
        
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        message = "🤖 <b>Test de Telegram Bot</b>\n\nEl bot está funcionando correctamente."
        return self.send_message(message)
