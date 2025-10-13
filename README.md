# LeyesVzla - Plataforma Legal de Venezuela

Plataforma web para consulta y gestión de legislación venezolana con autenticación segura y panel administrativo.

## Características Principales

- 🚀 **Frontend React** con interfaz moderna y responsiva
- 🔐 **Autenticación JWT** con tokens de acceso y renovación
- 👥 **Gestión de usuarios** con roles de administrador y usuario regular
- 📝 **Sistema de cotizaciones legales**
- 🔍 **Búsqueda avanzada** de legislación venezolana
- 📧 **Recuperación de contraseña** vía correo electrónico
- 🔄 **API RESTful** con FastAPI
- 🗄️ **Base de datos MongoDB** para almacenamiento escalable

## Requisitos Previos

- Python 3.9+
- Node.js 16+
- MongoDB 5.0+
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/BRUFHALO/Leyezvzla.git
cd Leyezvzla
```

### 2. Configuración del Backend

1. Navegar al directorio del backend:
   ```bash
   cd backend
   ```

2. Crear un entorno virtual y activarlo:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   # o
   source venv/bin/activate  # Linux/Mac
   ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Configurar variables de entorno:
   Crear un archivo `.env` en el directorio `backend` con las siguientes variables:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=leyesvzla
   MONGO_COLLECTION_USERS=users
   JWT_SECRET_KEY=tu_clave_secreta_muy_segura
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   RESEND_API_KEY=tu_api_key_de_resend
   ```

5. Iniciar el servidor de desarrollo:
   ```bash
   python run.py
   ```

### 3. Configuración del Frontend

1. En una nueva terminal, navegar al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configurar las variables de entorno:
   Crear un archivo `.env` en el directorio `frontend` con:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. Iniciar la aplicación:
   ```bash
   npm run dev
   # o
   yarn run dev
   ```

## Usuarios por Defecto

Se crean automáticamente dos usuarios administradores:

- **Usuario 1:**
  - Email: admin1@example.com
  - Contraseña: Admin123!@#

- **Usuario 2:**
  - Email: admin2@example.com
  - Contraseña: Admin456!@#

## Características de Seguridad

- Autenticación JWT con expiración configurable
- Hash de contraseñas con bcrypt
- Validación de contraseñas fuertes
- Bloqueo de cuentas después de 5 intentos fallidos
- Forzado de cambio de contraseña cada 2 meses
- Tokens CSRF para protección contra ataques

## Estructura del Proyecto

```
leyesvzla/
├── backend/               # Código del servidor FastAPI
│   ├── models/            # Modelos de base de datos
│   ├── routes/            # Rutas de la API
│   ├── schemas/           # Esquemas Pydantic
│   ├── services/          # Lógica de negocio
│   ├── utils/             # Utilidades
│   ├── main.py            # Punto de entrada de la aplicación
│   └── requirements.txt   # Dependencias de Python
│
└── frontend/              # Aplicación React
    ├── public/            # Archivos estáticos
    └── src/               # Código fuente
        ├── components/    # Componentes reutilizables
        ├── pages/         # Páginas de la aplicación
        ├── context/       # Contextos de React
        └── App.tsx        # Componente principal
```

## Despliegue

### Backend

1. Configurar un servidor con Python 3.9+
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Configurar variables de entorno de producción
4. Usar Gunicorn con Uvicorn para producción:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

### Frontend

1. Construir la versión de producción:
   ```bash
   npm run build
   # o
   yarn build
   ```
2. Servir los archivos estáticos con Nginx o similar

## Contribución

1. Hacer fork del repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Hacer commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Hacer push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

## Contacto

BRUFHALO - [@tu_twitter](https://twitter.com/tu_twitter)

Enlace al proyecto: [https://github.com/BRUFHALO/Leyezvzla](https://github.com/BRUFHALO/Leyezvzla)

## Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Resend](https://resend.com/)
