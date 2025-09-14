import os
import resend
from typing import Dict, Any
from dotenv import load_dotenv

# Forzar recarga del archivo .env
import dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path, override=True)

# Configurar Resend con la API key
api_key = os.getenv("RESEND_API_KEY")
resend.api_key = api_key

# Debug: Mostrar información de la API key al cargar
if api_key:
    print(f"📧 EmailService: API Key cargada: {api_key[:10]}...{api_key[-5:]}")
    print(f"📧 EmailService: Archivo .env leído desde: {dotenv_path}")
else:
    print("❌ EmailService: API Key NO encontrada")
    print(f"❌ EmailService: Archivo .env buscado en: {dotenv_path}")

class EmailService:
    @staticmethod
    def send_custom_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Envía un email personalizado usando Resend
        
        Args:
            to_email: Email del destinatario
            subject: Asunto del email
            html_content: Contenido HTML del email
            
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        try:
            print(f"🔄 Intentando enviar email a: {to_email}")
            print(f"📧 API Key configurada: {resend.api_key[:10] if resend.api_key else 'NO CONFIGURADA'}...")
            
            result = resend.Emails.send({
                "from": "LeyesVzla <onboarding@resend.dev>",  # Usar dominio de prueba de Resend
                "to": [to_email],
                "subject": subject,
                "html": html_content
            })
            
            print(f"✅ Email enviado exitosamente! ID: {result}")
            return True
            
        except Exception as e:
            print(f"❌ Error enviando email: {str(e)}")
            print(f"📧 Tipo de error: {type(e).__name__}")
            return False

    @staticmethod
    def send_quotation_email(to_email: str, quotation_data: Dict[str, Any]) -> bool:
        """
        Envía una cotización por email usando Resend
        
        Args:
            to_email: Email del destinatario
            quotation_data: Datos de la cotización
            
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        try:
            # Extraer datos de la cotización
            client_name = quotation_data.get("clientName", "Cliente")
            client_email = quotation_data.get("clientEmail", "")
            client_phone = quotation_data.get("clientPhone", "")
            selected_laws = quotation_data.get("selectedLaws", [])
            encuadernacion = quotation_data.get("encuadernacion", {})
            total_cost = quotation_data.get("totalCost", 0)
            payment_option = quotation_data.get("paymentOption", "")
            created_at = quotation_data.get("createdAt", "")
            
            # Construir lista de leyes
            laws_html = ""
            if selected_laws:
                laws_html = "<ul>"
                for law in selected_laws:
                    law_name = law.get("name", "Ley sin nombre")
                    law_price = law.get("price", 0)
                    laws_html += f"<li>{law_name} - ${law_price:,.2f}</li>"
                laws_html += "</ul>"
            else:
                laws_html = "<p>No se seleccionaron leyes</p>"
            
            # Información de encuadernación
            binding_html = ""
            if encuadernacion:
                binding_type = encuadernacion.get("type", "No especificado")
                binding_cost = encuadernacion.get("cost", 0)
                binding_html = f"""
                <p><strong>Tipo:</strong> {binding_type}</p>
                <p><strong>Costo:</strong> ${binding_cost:,.2f}</p>
                """
            else:
                binding_html = "<p>Sin encuadernación</p>"
            
            # Crear contenido HTML del email
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Cotización Legal - LeyesVzla</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9fafb; }}
                    .section {{ margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                    .total {{ background-color: #dc2626; color: white; padding: 15px; text-align: center; font-size: 1.2em; font-weight: bold; border-radius: 8px; }}
                    .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }}
                    ul {{ padding-left: 20px; }}
                    li {{ margin-bottom: 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>LeyesVzla</h1>
                        <p>Cotización Legal</p>
                    </div>
                    
                    <div class="content">
                        <div class="section">
                            <h2>Información del Cliente</h2>
                            <p><strong>Nombre:</strong> {client_name}</p>
                            <p><strong>Email:</strong> {client_email}</p>
                            <p><strong>Teléfono:</strong> {client_phone}</p>
                            <p><strong>Fecha:</strong> {created_at}</p>
                        </div>
                        
                        <div class="section">
                            <h2>Leyes Seleccionadas</h2>
                            {laws_html}
                        </div>
                        
                        <div class="section">
                            <h2>Encuadernación</h2>
                            {binding_html}
                        </div>
                        
                        <div class="section">
                            <h2>Opción de Pago</h2>
                            <p>{payment_option}</p>
                        </div>
                        
                        <div class="total">
                            Total: ${total_cost:,.2f}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Gracias por confiar en LeyesVzla</p>
                        <p>Para cualquier consulta, no dudes en contactarnos</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Enviar email
            result = resend.Emails.send({
                "from": "LeyesVzla <noreply@leyesvzla.com>",
                "to": [to_email],
                "subject": f"Cotización Legal - {client_name}",
                "html": html_content
            })
            
            return True
            
        except Exception as e:
            print(f"Error enviando cotización por email: {str(e)}")
            return False
