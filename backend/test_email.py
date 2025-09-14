#!/usr/bin/env python3
"""
Script de prueba para diagnosticar el envío de correos
"""
import os
import sys
import resend
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(override=True)  # Forzar recarga de variables

def test_resend_connection():
    """Probar la conexión con Resend"""
    api_key = os.getenv("RESEND_API_KEY")
    
    print("=== DIAGNÓSTICO DE CORREO ELECTRÓNICO ===")
    print(f"API Key configurada: {api_key[:10]}...{api_key[-5:] if api_key else 'NO CONFIGURADA'}")
    
    if not api_key or api_key == "tu_api_key_aqui":
        print("❌ ERROR: API Key no configurada correctamente")
        return False
    
    # Configurar Resend
    resend.api_key = api_key
    
    try:
        # Intentar enviar un email de prueba
        print("\n📧 Enviando email de prueba...")
        
        result = resend.Emails.send({
            "from": "LeyesVzla <onboarding@resend.dev>",  # Usar dominio de prueba
            "to": ["admin1@leyesvzla.com"],  # Email de prueba
            "subject": "Prueba de envío - LeyesVzla",
            "html": """
            <h1>Prueba de correo</h1>
            <p>Este es un email de prueba para verificar la configuración de Resend.</p>
            <p>Si recibes este mensaje, la configuración está funcionando correctamente.</p>
            """
        })
        
        print(f"✅ Email enviado exitosamente!")
        print(f"ID del mensaje: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando email: {str(e)}")
        
        # Diagnóstico adicional
        if "Invalid API key" in str(e):
            print("💡 Solución: Verifica que la API key sea correcta en Resend")
        elif "Domain not verified" in str(e):
            print("💡 Solución: Usa 'onboarding@resend.dev' como remitente para pruebas")
        elif "Invalid email" in str(e):
            print("💡 Solución: Verifica que el email de destino sea válido")
        
        return False

def test_password_reset():
    """Probar el sistema de recuperación de contraseña"""
    print("\n=== PRUEBA DE RECUPERACIÓN DE CONTRASEÑA ===")
    
    try:
        # Importar el servicio de autenticación
        sys.path.append(os.path.dirname(__file__))
        from services.auth_service import AuthService
        from database.mongodb import get_database
        
        # Obtener la base de datos
        db = get_database()
        auth_service = AuthService(db)
        
        # Probar con un email de administrador
        test_email = "admin1@leyesvzla.com"
        print(f"📧 Probando recuperación para: {test_email}")
        
        result = auth_service.request_password_reset(test_email)
        
        if result:
            print("✅ Solicitud de recuperación procesada correctamente")
            print("📬 Revisa tu bandeja de entrada y spam")
        else:
            print("❌ Error en la solicitud de recuperación")
            
    except Exception as e:
        print(f"❌ Error en prueba de recuperación: {str(e)}")

if __name__ == "__main__":
    print("Iniciando diagnóstico de correo electrónico...\n")
    
    # Probar conexión con Resend
    resend_ok = test_resend_connection()
    
    if resend_ok:
        # Si Resend funciona, probar el sistema completo
        test_password_reset()
    else:
        print("\n❌ No se puede continuar sin una configuración válida de Resend")
    
    print("\n=== FIN DEL DIAGNÓSTICO ===")
