# 💰 Finanzas Personales - Aplicación Full Stack

Una aplicación moderna para gestionar tus finanzas personales con backend Python (FastAPI) y frontend React.

## 🎯 Características Actuales

- ✅ Registrar gastos con categorías (Comida, Fiesta, Ropa, Gastos Extras, Transporte)
- ✅ Ver lista de gastos recientes
- ✅ Filtrar gastos por categoría
- ✅ Eliminar gastos
- ✅ Diseño moderno y distintivo
- ✅ Interfaz responsiva

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web moderno y rápido para Python
- **SQLAlchemy** - ORM para base de datos
- **SQLite** - Base de datos ligera
- **Pydantic** - Validación de datos

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool ultrarrápido
- **Lucide React** - Iconos modernos
- **CSS Moderno** - Variables CSS, Grid, Flexbox

## 📦 Instalación

### 1. Instalar Backend

```bash
cd backend

# Instalar dependencias de Python
pip install -r requirements.txt --break-system-packages

# Iniciar servidor
python main.py
# O usando el script:
./run.sh
```

El backend estará disponible en: `http://localhost:8000`
Documentación interactiva: `http://localhost:8000/docs`

### 2. Instalar Frontend

```bash
cd frontend

# Instalar dependencias de Node
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

## 🚀 Uso

1. **Iniciar Backend**: Abre una terminal y ejecuta el servidor FastAPI
2. **Iniciar Frontend**: En otra terminal, ejecuta el servidor de desarrollo de Vite
3. **Abrir navegador**: Ve a `http://localhost:3000`

## 📁 Estructura del Proyecto

```
finanzas-app/
├── backend/
│   ├── main.py              # Servidor FastAPI principal
│   ├── database.py          # Modelos de base de datos
│   ├── schemas.py           # Schemas Pydantic
│   ├── requirements.txt     # Dependencias Python
│   └── run.sh              # Script para ejecutar
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AgregarGasto.jsx
    │   │   └── ListaGastos.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🎓 Conceptos Técnicos Involucrados

### Backend - Python/FastAPI

1. **API RESTful**
   - Endpoints para operaciones CRUD (Create, Read, Update, Delete)
   - Verbos HTTP: GET, POST, DELETE
   - Códigos de estado HTTP (200, 201, 404, etc.)

2. **ORM (Object-Relational Mapping)**
   - SQLAlchemy para mapear objetos Python a tablas de base de datos
   - Modelos: `Gasto`, `Presupuesto`
   - Relaciones y consultas

3. **Validación de Datos**
   - Pydantic para validar datos de entrada
   - Type hints de Python
   - Schemas: `GastoCreate`, `GastoResponse`

4. **Dependency Injection**
   - `Depends()` para inyectar dependencias (como sesión de BD)
   - Patrón de diseño para código más limpio

5. **CORS (Cross-Origin Resource Sharing)**
   - Middleware para permitir peticiones desde el frontend
   - Seguridad web

### Frontend - React

1. **Componentes Funcionales**
   - `AgregarGasto`, `ListaGastos`
   - Props y composición de componentes

2. **Hooks de React**
   - `useState`: Manejo de estado local
   - `useEffect`: Efectos secundarios y llamadas a API
   - Ciclo de vida de componentes

3. **Fetch API**
   - Peticiones HTTP asíncronas al backend
   - Async/await
   - Manejo de promesas

4. **CSS Moderno**
   - CSS Variables (custom properties)
   - Grid y Flexbox para layouts
   - Animaciones y transiciones
   - Media queries para responsive design

5. **Event Handling**
   - Formularios controlados
   - Validación en tiempo real
   - Eventos onClick, onChange, onSubmit

## 🎨 Filosofía de Diseño

El diseño evita estéticas genéricas de IA:
- **Tipografía distintiva**: DM Serif Display + Plus Jakarta Sans
- **Paleta audaz**: Gradientes, colores vivos para categorías
- **Animaciones sutiles**: Transiciones suaves, efectos hover
- **Dark theme**: Fondo oscuro con acentos de color
- **Espaciado generoso**: Uso de whitespace para claridad

## 🔜 Próximas Características

- [ ] Gestión de presupuestos por categoría
- [ ] Dashboard con gráficos
- [ ] Exportar datos
- [ ] Filtros avanzados (por fecha, rango de montos)
- [ ] Editar gastos existentes
- [ ] PWA para uso en móvil

## 📝 Notas

- La base de datos se crea automáticamente al iniciar el backend
- Los datos se guardan en `backend/finanzas.db`
- El frontend usa proxy para evitar problemas de CORS en desarrollo
