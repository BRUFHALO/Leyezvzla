# Configuración de Telegram Bot para Recuperación de Contraseñas

## 📋 Resumen
El sistema de recuperación de contraseñas ahora envía las contraseñas temporales a través de Telegram en lugar de correo electrónico. Todos los mensajes se envían al chat ID: **5567606129**.

## 🤖 Paso 1: Crear un Bot de Telegram

1. Abre Telegram y busca **@BotFather**
2. Envía el comando `/newbot`
3. Sigue las instrucciones:
   - Elige un nombre para tu bot (ej: "LeyesVzla Recovery Bot")
   - Elige un username (debe terminar en 'bot', ej: "leyesvzla_recovery_bot")
4. BotFather te dará un **token** como este:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. **Guarda este token**, lo necesitarás para el siguiente paso

## 🔑 Paso 2: Configurar el Token en el Proyecto

1. Abre el archivo `.env` en la carpeta `backend`
2. Busca la línea que dice:
   ```
   TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
   ```
3. Reemplaza `YOUR_BOT_TOKEN_HERE` con el token que te dio BotFather:
   ```
   TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
   ```
4. Guarda el archivo

## 💬 Paso 3: Iniciar el Bot

1. En Telegram, busca tu bot por el username que elegiste
2. Haz clic en **Start** o envía `/start`
3. El bot ya está listo para recibir comandos

## 📱 Paso 4: Verificar el Chat ID

El chat ID ya está configurado como **5567606129** en el archivo `.env`:
```
TELEGRAM_CHAT_ID="5567606129"
```

Si necesitas cambiar el chat ID:
1. Envía un mensaje a tu bot desde el chat deseado
2. Visita: `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
3. Busca el campo `"chat":{"id":...}` en la respuesta
4. Actualiza el valor en el archivo `.env`

## 🧪 Paso 5: Probar la Configuración

### Instalar dependencias
```bash
cd backend
pip install -r requirements.txt
```

### Ejecutar el script de prueba
```bash
python test_telegram.py
```

Este script:
- ✅ Verifica que el token esté configurado
- ✅ Envía un mensaje de prueba
- ✅ Envía un mensaje de recuperación de contraseña de ejemplo

## 🔐 Cómo Funciona la Recuperación de Contraseña

1. El usuario ingresa su **nombre de usuario** en el formulario de recuperación
2. El sistema busca el usuario en la base de datos
3. Si el usuario existe, se genera una contraseña temporal segura
4. Se envía un mensaje a Telegram con:
   - 👤 Nombre de usuario
   - 📧 Email del usuario
   - 🔑 Contraseña temporal
   - ⚠️ Instrucciones de seguridad
5. El administrador recibe el mensaje en el chat configurado (ID: 5567606129)
6. El administrador proporciona la contraseña temporal al usuario
7. El usuario puede iniciar sesión con la contraseña temporal
8. El sistema obliga al usuario a cambiar la contraseña inmediatamente

## 📝 Formato del Mensaje

El mensaje que se envía por Telegram tiene este formato:

```
🔐 Recuperación de Contraseña - LeyesVzla

👤 Usuario: admin1
📧 Email: admin@leyesvzla.com

🔑 Contraseña Temporal:
Test123!@#

⚠️ Instrucciones:
• Esta contraseña es temporal
• Debe ser cambiada inmediatamente al iniciar sesión
• Por seguridad, expira en 24 horas

🌐 Acceder al sistema:
http://localhost:3000/login
```

## 🔧 Solución de Problemas

### Error: "TELEGRAM_BOT_TOKEN no configurado"
- Verifica que hayas agregado el token en el archivo `.env`
- Asegúrate de que el archivo `.env` esté en la carpeta `backend`
- Reinicia el servidor después de modificar el `.env`

### Error: "Forbidden: bot was blocked by the user"
- El bot fue bloqueado por el usuario
- Desbloquea el bot en Telegram y envía `/start`

### Error: "Bad Request: chat not found"
- El chat ID es incorrecto
- Verifica el chat ID usando el método descrito en el Paso 4

### El mensaje no llega
- Verifica que el bot tenga permisos para enviar mensajes
- Asegúrate de haber iniciado el bot con `/start`
- Revisa los logs del servidor para ver errores específicos

## 🔒 Seguridad

- ✅ El token del bot debe mantenerse secreto
- ✅ No compartas el token en repositorios públicos
- ✅ El archivo `.env` está en `.gitignore` por defecto
- ✅ Las contraseñas temporales son generadas de forma segura
- ✅ Las contraseñas se hashean antes de guardarse en la base de datos

## 📚 Recursos Adicionales

- [Documentación oficial de Telegram Bot API](https://core.telegram.org/bots/api)
- [Guía de BotFather](https://core.telegram.org/bots#6-botfather)
- [Cómo obtener el Chat ID](https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id)
