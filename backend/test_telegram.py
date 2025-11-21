"""
Script para probar el envío de mensajes por Telegram
"""
import sys
import os

# Agregar el directorio backend al path para importar los módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.telegram_service import TelegramService

def test_telegram_service():
    """Prueba el servicio de Telegram"""
    print("=" * 60)
    print("🤖 PRUEBA DE SERVICIO DE TELEGRAM")
    print("=" * 60)
    
    telegram_service = TelegramService()
    
    # Verificar configuración
    print(f"\n📋 Configuración:")
    print(f"   Chat ID: {telegram_service.chat_id}")
    print(f"   Bot Token configurado: {'✅ Sí' if telegram_service.bot_token else '❌ No'}")
    
    if not telegram_service.bot_token:
        print("\n⚠️  ERROR: TELEGRAM_BOT_TOKEN no está configurado en el archivo .env")
        print("   Por favor, agrega tu token de bot en el archivo .env:")
        print("   TELEGRAM_BOT_TOKEN=\"tu_token_aqui\"")
        return False
    
    # Enviar mensaje de prueba
    print(f"\n📱 Enviando mensaje de prueba...")
    result = telegram_service.send_test_message()
    
    if result:
        print("\n✅ ¡Mensaje enviado exitosamente!")
        print(f"   Verifica el chat de Telegram con ID: {telegram_service.chat_id}")
    else:
        print("\n❌ Error al enviar el mensaje")
        print("   Verifica que:")
        print("   1. El token del bot sea válido")
        print("   2. El bot tenga permisos para enviar mensajes")
        print("   3. El chat ID sea correcto")
    
    return result

def test_password_recovery():
    """Prueba el envío de recuperación de contraseña"""
    print("\n" + "=" * 60)
    print("🔐 PRUEBA DE RECUPERACIÓN DE CONTRASEÑA")
    print("=" * 60)
    
    telegram_service = TelegramService()
    
    # Datos de prueba
    username = "admin1"
    email = "admin@leyesvzla.com"
    temp_password = "Test123!@#"
    
    print(f"\n📋 Datos de prueba:")
    print(f"   Usuario: {username}")
    print(f"   Email: {email}")
    print(f"   Contraseña temporal: {temp_password}")
    
    print(f"\n📱 Enviando mensaje de recuperación...")
    result = telegram_service.send_password_recovery(username, email, temp_password)
    
    if result:
        print("\n✅ ¡Mensaje de recuperación enviado exitosamente!")
        print(f"   Verifica el chat de Telegram con ID: {telegram_service.chat_id}")
    else:
        print("\n❌ Error al enviar el mensaje de recuperación")
    
    return result

if __name__ == "__main__":
    print("\n🚀 Iniciando pruebas del servicio de Telegram...\n")
    
    # Prueba 1: Mensaje de prueba
    test1_result = test_telegram_service()
    
    # Prueba 2: Mensaje de recuperación de contraseña
    if test1_result:
        test2_result = test_password_recovery()
    
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    print(f"Mensaje de prueba: {'✅ Exitoso' if test1_result else '❌ Fallido'}")
    if test1_result:
        print(f"Recuperación de contraseña: {'✅ Exitoso' if test2_result else '❌ Fallido'}")
    print("=" * 60)
